import { CarPhysics } from '../../engine/CarPhysics';
import { ITrack, TrackBounds, SurfaceProperties } from '../../engine/ITrack';

export interface DynamicCone {
  id: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  radius: number;
  state: 'standing' | 'flying' | 'hidden';
  flyTimer: number;
  respawnTimer: number;
  opacity: number;
}

export interface SolidTree {
  x: number;
  y: number;
  trunkRadius: number;
  canopyRadius: number;
  color: string;
}

export interface BarrierBox {
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
  text?: string;
  color: string;
  type: 'billboard' | 'pitwall' | 'tirewall';
}

export interface LeafParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

/**
 * Motorsport Proving Ground - Full featured demo track implementation of ITrack.
 * Features:
 * - Flowing Grand Prix Circuit with curbs and unobstructed start straight
 * - Dedicated Drift Skidpad (West)
 * - Dedicated Autocross / Gymkhana Cone Park (East)
 * - Dynamic flying cones that tumble, disappear, and respawn after 5s when clear
 * - Solid collidable tree trunks with leaf impact particles
 * - Pit wall & sponsor barrier collisions
 * - Realistic off-track grass drag & lower grip
 */
export class DemoTrack implements ITrack {
  public bounds: TrackBounds = {
    minX: -1350,
    maxX: 1350,
    minY: -1350,
    maxY: 1350
  };

  public cones: DynamicCone[] = [];
  public trees: SolidTree[] = [];
  public barriers: BarrierBox[] = [];
  public leafParticles: LeafParticle[] = [];

  constructor() {
    this.initWorldElements();
    this.initCones();
  }

  private initCones() {
    this.cones = [];
    let id = 1;

    // Dedicated Autocross / Gymkhana Zone on the East side (x ≈ 420 to 820, y ≈ -200 to 500)
    // Slalom Section 1
    for (let y = -150; y <= 350; y += 100) {
      this.cones.push(this.createCone(id++, 520, y));
    }

    // Slalom Section 2 (offset)
    for (let y = -100; y <= 400; y += 120) {
      this.cones.push(this.createCone(id++, 680, y));
    }

    // Precision Cone Gates
    const gates = [
      { x1: 440, y1: -220, x2: 480, y2: -220 },
      { x1: 720, y1: -220, x2: 760, y2: -220 },
      { x1: 440, y1: 460, x2: 480, y2: 460 },
      { x1: 720, y1: 460, x2: 760, y2: 460 },
      // Hairpin apex marker
      { x1: 600, y1: 120, x2: 600, y2: 150 }
    ];

    for (const g of gates) {
      this.cones.push(this.createCone(id++, g.x1, g.y1));
      this.cones.push(this.createCone(id++, g.x2, g.y2));
    }
  }

  private createCone(id: number, x: number, y: number): DynamicCone {
    return {
      id,
      originX: x,
      originY: y,
      x,
      y,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
      radius: 12,
      state: 'standing',
      flyTimer: 0,
      respawnTimer: 0,
      opacity: 1
    };
  }

  private initWorldElements() {
    // Trees with solid trunks positioned outside roads & in lush green infields
    this.trees = [
      // Top boundary grove
      { x: -950, y: -1200, trunkRadius: 16, canopyRadius: 46, color: '#166534' },
      { x: -700, y: -1220, trunkRadius: 18, canopyRadius: 52, color: '#15803d' },
      { x: -450, y: -1190, trunkRadius: 15, canopyRadius: 44, color: '#14532d' },
      { x: 150, y: -1210, trunkRadius: 16, canopyRadius: 48, color: '#166534' },
      { x: 500, y: -1220, trunkRadius: 18, canopyRadius: 54, color: '#15803d' },
      { x: 850, y: -1190, trunkRadius: 15, canopyRadius: 45, color: '#14532d' },
      { x: 1100, y: -1200, trunkRadius: 17, canopyRadius: 50, color: '#166534' },

      // Bottom boundary grove (Placed safely clear of South Hairpin loop)
      { x: -1050, y: 1200, trunkRadius: 16, canopyRadius: 48, color: '#14532d' },
      { x: -650, y: 1220, trunkRadius: 18, canopyRadius: 52, color: '#15803d' },
      { x: -300, y: 1190, trunkRadius: 15, canopyRadius: 42, color: '#166534' },
      { x: -80, y: 1220, trunkRadius: 17, canopyRadius: 46, color: '#15803d' },
      { x: 1100, y: 1210, trunkRadius: 18, canopyRadius: 52, color: '#166534' },

      // Left boundary forest
      { x: -1220, y: -800, trunkRadius: 16, canopyRadius: 46, color: '#166534' },
      { x: -1240, y: -400, trunkRadius: 17, canopyRadius: 50, color: '#15803d' },
      { x: -1220, y: 0, trunkRadius: 18, canopyRadius: 52, color: '#14532d' },
      { x: -1240, y: 400, trunkRadius: 16, canopyRadius: 48, color: '#166534' },
      { x: -1220, y: 800, trunkRadius: 17, canopyRadius: 50, color: '#15803d' },

      // Right boundary forest
      { x: 1220, y: -700, trunkRadius: 17, canopyRadius: 50, color: '#15803d' },
      { x: 1240, y: -200, trunkRadius: 16, canopyRadius: 46, color: '#14532d' },
      { x: 1220, y: 300, trunkRadius: 18, canopyRadius: 52, color: '#166534' },
      { x: 1240, y: 750, trunkRadius: 17, canopyRadius: 48, color: '#15803d' },

      // GP Infield Trees (in grass islands, completely clear of road & curbs)
      { x: 280, y: -420, trunkRadius: 16, canopyRadius: 45, color: '#166534' },
      { x: -350, y: -450, trunkRadius: 18, canopyRadius: 50, color: '#15803d' },
      { x: 990, y: 50, trunkRadius: 17, canopyRadius: 46, color: '#14532d' },
      { x: -380, y: 500, trunkRadius: 16, canopyRadius: 46, color: '#166534' },
      { x: 380, y: 720, trunkRadius: 17, canopyRadius: 48, color: '#15803d' }
    ];

    // Solid Trackside Barriers (Pit Lane Wall)
    this.barriers = [
      // Pit Lane Dividing Wall (Parallel to main straight at x = -135)
      { x: -135, y: 120, w: 18, h: 480, angle: 0, color: '#facc15', type: 'pitwall' }
    ];
  }

  public update(dt: number, car: CarPhysics): void {
    if (dt <= 0) return;

    // 1. Update Dynamic Cones
    for (const cone of this.cones) {
      if (cone.state === 'flying') {
        cone.x += cone.vx * dt;
        cone.y += cone.vy * dt;
        cone.angle += cone.angularVelocity * dt;

        // Ground sliding friction & spin decay
        const friction = Math.pow(0.88, dt * 60);
        cone.vx *= friction;
        cone.vy *= friction;
        cone.angularVelocity *= Math.pow(0.90, dt * 60);

        cone.flyTimer += dt;
        if (cone.flyTimer > 0.8) {
          // Smooth fade out over last 0.4s
          cone.opacity = Math.max(0, 1 - (cone.flyTimer - 0.8) / 0.4);
        }

        if (cone.flyTimer >= 1.2) {
          cone.state = 'hidden';
          cone.opacity = 0;
          cone.respawnTimer = 5.0; // Start 5-second countdown
        }
      } else if (cone.state === 'hidden') {
        cone.respawnTimer -= dt;

        // Check if 5 seconds elapsed
        if (cone.respawnTimer <= 0) {
          // Check car distance from origin
          const carDist = Math.hypot(car.x - cone.originX, car.y - cone.originY);
          const minClearance = 55; // Car half-diag (36) + cone (12) + buffer

          if (carDist > minClearance) {
            // Respawn cleanly
            cone.x = cone.originX;
            cone.y = cone.originY;
            cone.vx = 0;
            cone.vy = 0;
            cone.angle = 0;
            cone.angularVelocity = 0;
            cone.opacity = 1;
            cone.state = 'standing';
            cone.flyTimer = 0;
            cone.respawnTimer = 0;
          } else {
            // Keep waiting until car drives away
            cone.respawnTimer = 0.1;
          }
        }
      }
    }

    // 2. Update Leaf Particles
    for (let i = this.leafParticles.length - 1; i >= 0; i--) {
      const p = this.leafParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
      if (p.life <= 0) {
        this.leafParticles.splice(i, 1);
      }
    }
  }

  public checkCollisions(car: CarPhysics, _dt: number): void {
    const carRadius = 26;

    // A. Outer Perimeter Boundaries
    this.checkPerimeterWalls(car);

    // B. Solid Tree Trunks
    for (const tree of this.trees) {
      const dx = car.x - tree.x;
      const dy = car.y - tree.y;
      const dist = Math.hypot(dx, dy);
      const minDist = carRadius + tree.trunkRadius;

      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;

        // Push car out along contact normal
        car.x = tree.x + nx * minDist;
        car.y = tree.y + ny * minDist;

        // Rebound impulse
        const vDotN = car.vx * nx + car.vy * ny;
        if (vDotN < 0) {
          const bounce = 0.42;
          car.vx -= (1 + bounce) * vDotN * nx;
          car.vy -= (1 + bounce) * vDotN * ny;
          car.longitudinalVelocity = Math.max(0, car.longitudinalVelocity * 0.25);
          car.angularVelocity = (Math.random() - 0.5) * 4;

          // Spawn leaf explosion on impact
          this.spawnLeaves(tree.x, tree.y, 14, tree.color);
        }
      }
    }

    // C. Solid Barrier Boxes (Pit wall, tire walls, billboards)
    for (const b of this.barriers) {
      this.checkBarrierCollision(car, b);
    }

    // D. Dynamic Cones
    for (const cone of this.cones) {
      if (cone.state !== 'standing') continue;

      const dx = cone.x - car.x;
      const dy = cone.y - car.y;
      const dist = Math.hypot(dx, dy);
      const minDist = carRadius + cone.radius;

      if (dist < minDist) {
        // Impact! Send cone flying
        cone.state = 'flying';
        cone.flyTimer = 0;

        const nx = dist > 0.001 ? dx / dist : 0;
        const ny = dist > 0.001 ? dy / dist : -1;

        const carSpeed = Math.hypot(car.vx, car.vy);
        const launchSpeed = Math.max(carSpeed * 1.3, 140);

        cone.vx = car.vx * 0.75 + nx * launchSpeed * 0.7;
        cone.vy = car.vy * 0.75 + ny * launchSpeed * 0.7;
        cone.angularVelocity = (Math.random() - 0.5) * 28;

        // Small tactile feedback scrub on car
        car.longitudinalVelocity *= 0.96;
      }
    }
  }

  private checkBarrierCollision(car: CarPhysics, b: BarrierBox) {
    // Transform car into barrier local space
    const cos = Math.cos(-b.angle);
    const sin = Math.sin(-b.angle);
    const relX = car.x - b.x;
    const relY = car.y - b.y;

    const localX = relX * cos - relY * sin;
    const localY = relX * sin + relY * cos;

    const halfW = b.w / 2;
    const halfH = b.h / 2;
    const carR = 24;

    // Find closest point on barrier box
    const clampedX = Math.max(-halfW, Math.min(halfW, localX));
    const clampedY = Math.max(-halfH, Math.min(halfH, localY));

    const diffX = localX - clampedX;
    const diffY = localY - clampedY;
    const dist = Math.hypot(diffX, diffY);

    if (dist < carR && dist > 0.0001) {
      const localNx = diffX / dist;
      const localNy = diffY / dist;

      // Transform normal back to world space
      const worldCos = Math.cos(b.angle);
      const worldSin = Math.sin(b.angle);
      const worldNx = localNx * worldCos - localNy * worldSin;
      const worldNy = localNx * worldSin + localNy * worldCos;

      // Push car out
      car.x += worldNx * (carR - dist);
      car.y += worldNy * (carR - dist);

      // Rebound
      const vDotN = car.vx * worldNx + car.vy * worldNy;
      if (vDotN < 0) {
        const bounce = b.type === 'tirewall' ? 0.6 : 0.35;
        car.vx -= (1 + bounce) * vDotN * worldNx;
        car.vy -= (1 + bounce) * vDotN * worldNy;
        car.longitudinalVelocity *= 0.4;
      }
    }
  }

  private checkPerimeterWalls(car: CarPhysics) {
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

  public getSurfaceAt(x: number, y: number): SurfaceProperties {
    // 1. Skidpad Circle (West: cx = -780, cy = 0, radius = 360)
    const skidDist = Math.hypot(x - (-780), y);
    if (skidDist <= 360) {
      return { type: 'asphalt', gripMultiplier: 1.0, dragMultiplier: 1.0 };
    }

    // 2. Autocross Pad (East: x: 380 to 860, y: -260 to 520)
    if (x >= 380 && x <= 860 && y >= -260 && y <= 520) {
      return { type: 'asphalt', gripMultiplier: 1.0, dragMultiplier: 1.0 };
    }

    // 3. Main Straightaway & Pit Lane (-260 <= x <= 140, -500 <= y <= 750)
    if (x >= -260 && x <= 140 && y >= -500 && y <= 750) {
      return { type: 'asphalt', gripMultiplier: 1.0, dragMultiplier: 1.0 };
    }

    // 4. North Sweeper Turn Ribbon
    if (y < -400 && y >= -950 && x >= -150 && x <= 950) {
      return { type: 'asphalt', gripMultiplier: 1.0, dragMultiplier: 1.0 };
    }

    // 5. South Return Loop Ribbon
    if (y > 600 && y <= 1050 && x >= -150 && x <= 950) {
      return { type: 'asphalt', gripMultiplier: 1.0, dragMultiplier: 1.0 };
    }

    // 6. Connecting Roads
    // Skidpad access road (y: -80 to 80, x: -780 to -110)
    if (y >= -90 && y <= 90 && x >= -780 && x <= -110) {
      return { type: 'asphalt', gripMultiplier: 1.0, dragMultiplier: 1.0 };
    }

    // Off-track Lawn Grass: Less grip, higher rolling drag
    return {
      type: 'grass',
      gripMultiplier: 0.82,
      dragMultiplier: 1.28
    };
  }

  private spawnLeaves(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.leafParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1,
        color,
        size: 3 + Math.random() * 3
      });
    }
  }

  public reset(): void {
    for (const cone of this.cones) {
      cone.x = cone.originX;
      cone.y = cone.originY;
      cone.vx = 0;
      cone.vy = 0;
      cone.angle = 0;
      cone.angularVelocity = 0;
      cone.opacity = 1;
      cone.state = 'standing';
      cone.flyTimer = 0;
      cone.respawnTimer = 0;
    }
    this.leafParticles = [];
  }

  // =========================================================================
  // RENDERING PIPELINE
  // =========================================================================

  public render(ctx: CanvasRenderingContext2D, camX: number, camY: number, viewW: number, viewH: number): void {
    const radius = Math.hypot(viewW, viewH) * 1.35;
    const startX = camX - radius;
    const endX = camX + radius;
    const startY = camY - radius;
    const endY = camY + radius;

    // 1. Lush Green Lawn Background (Lighter daytime/evening fairway green)
    ctx.fillStyle = '#2e633d';
    ctx.fillRect(startX, startY, endX - startX, endY - startY);

    // Lawn mowing stripes for sense of scale and velocity
    const stripeW = 160;
    const lawnStartY = Math.floor(startY / stripeW) * stripeW;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
    for (let y = lawnStartY; y <= endY; y += stripeW * 2) {
      ctx.fillRect(startX, y, endX - startX, stripeW);
    }

    // 2. Asphalt Circuit Ground Ribbons & Zones
    this.renderAsphaltTracks(ctx);

    // 3. Apex Rumble Curbs (Red & White Kerbs)
    this.renderApexCurbs(ctx);

    // 4. Ground Markings & Grid
    this.renderGroundMarkings(ctx);

    // 5. Solid Barriers & Pit Walls
    this.renderBarriers(ctx);

    // 6. Dynamic Cones (Standing & Flying)
    this.renderCones(ctx);

    // 7. Leaf Explosion Particles
    this.renderLeaves(ctx);

    // 8. Solid Trees with Canopies and Drop Shadows
    this.renderTrees(ctx);

    // 9. Outer Boundary Crash Barrier
    this.renderBoundaryWalls(ctx);
  }

  private renderAsphaltTracks(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = '#11141e'; // Premium dark tarmac
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 12;

    // Main Straightaway (-120 to +120, y: -500 to 750)
    ctx.fillRect(-120, -500, 240, 1250);

    // Pit Lane Bay (-240 to -120, y: -200 to 450)
    ctx.fillStyle = '#151926';
    ctx.fillRect(-240, -200, 120, 650);

    // Dedicated Skidpad (West: cx = -780, cy = 0, radius = 350)
    ctx.fillStyle = '#11141e';
    ctx.beginPath();
    ctx.arc(-780, 0, 350, 0, Math.PI * 2);
    ctx.fill();

    // Skidpad Access Connector Road
    ctx.fillRect(-780, -75, 680, 150);

    // Dedicated Autocross Pad (East: x: 380 to 860, y: -260 to 520)
    ctx.fillStyle = '#131722';
    ctx.fillRect(380, -260, 480, 780);

    // North Sweeper Track Ribbon (Connects main straight at x=0, y=-500 to East straight at x=800, y=-500)
    ctx.beginPath();
    ctx.arc(400, -500, 400, Math.PI, Math.PI * 2, false);
    ctx.lineWidth = 240;
    ctx.strokeStyle = '#11141e';
    ctx.stroke();

    // South Hairpin Return Loop Ribbon (Connects East straight at x=800, y=750 to main straight at x=0, y=750)
    ctx.beginPath();
    ctx.arc(400, 750, 400, 0, Math.PI, false);
    ctx.lineWidth = 240;
    ctx.strokeStyle = '#11141e';
    ctx.stroke();

    // Connector East straight ribbon (x: 680 to 920, y: -500 to 750, width 240)
    ctx.fillRect(680, -500, 240, 1250);

    ctx.restore();
  }

  private renderApexCurbs(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // North Corner Apex Kerbs (inner r=280, outer r=520, exactly meets x=-120, +120, 680, 920)
    this.renderCurvedCurb(ctx, 400, -500, 280, Math.PI, Math.PI * 2, 20);
    this.renderCurvedCurb(ctx, 400, -500, 520, Math.PI, Math.PI * 2, 20);

    // South Hairpin Apex Kerbs (inner r=280, outer r=520, exactly meets x=-120, +120, 680, 920)
    this.renderCurvedCurb(ctx, 400, 750, 280, 0, Math.PI, 20);
    this.renderCurvedCurb(ctx, 400, 750, 520, 0, Math.PI, 20);

    // Main Straightaway entry/exit edge curbs (centered on x=-120 and x=+120, matching curve meeting points)
    this.renderLinearCurb(ctx, -130, -500, 20, 250, false);
    this.renderLinearCurb(ctx, 110, -500, 20, 250, false);
    this.renderLinearCurb(ctx, -130, 500, 20, 250, false);
    this.renderLinearCurb(ctx, 110, 500, 20, 250, false);

    // East Straightaway entry/exit edge curbs (centered on x=680 and x=920, matching curve meeting points)
    this.renderLinearCurb(ctx, 670, -500, 20, 250, false);
    this.renderLinearCurb(ctx, 910, -500, 20, 250, false);
    this.renderLinearCurb(ctx, 670, 500, 20, 250, false);
    this.renderLinearCurb(ctx, 910, 500, 20, 250, false);
    ctx.restore();
  }

  private renderCurvedCurb(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, startA: number, endA: number, width: number) {
    const segments = 16;
    const step = (endA - startA) / segments;
    for (let i = 0; i < segments; i++) {
      ctx.strokeStyle = i % 2 === 0 ? '#dc2626' : '#f8fafc';
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startA + i * step, startA + (i + 1) * step);
      ctx.stroke();
    }
  }

  private renderLinearCurb(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, horizontal: boolean) {
    const seg = 28;
    if (horizontal) {
      const count = Math.ceil(w / seg);
      for (let i = 0; i < count; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#f8fafc';
        ctx.fillRect(x + i * seg, y, Math.min(seg, w - i * seg), h);
      }
    } else {
      const count = Math.ceil(h / seg);
      for (let i = 0; i < count; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#f8fafc';
        ctx.fillRect(x, y + i * seg, w, Math.min(seg, h - i * seg));
      }
    }
  }

  private renderGroundMarkings(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 1. Unobstructed Start / Finish Line at (0, 200)
    const yStart = 200;
    const checkSize = 16;
    const checkW = 200;
    const startX = -checkW / 2;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < checkW / checkSize; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#11141e';
        ctx.fillRect(startX + col * checkSize, yStart + row * checkSize, checkSize, checkSize);
      }
    }

    // Grid Slot Boxes for Clean Launch (Cleanly positioned before the Start/Finish line)
    ctx.strokeStyle = 'rgba(255, 235, 59, 0.75)';
    ctx.lineWidth = 3;

    // Slot 1 (Pole Position - Left, centered at x = -32, y = 290)
    ctx.strokeRect(-56, yStart + 50, 48, 80);
    // Slot 2 (Right - staggered, centered at x = 32, y = 390)
    ctx.strokeRect(8, yStart + 150, 48, 80);
    // Slot 3 (Left, centered at x = -32, y = 490)
    ctx.strokeRect(-56, yStart + 250, 48, 80);
    // Slot 4 (Right, centered at x = 32, y = 590)
    ctx.strokeRect(8, yStart + 350, 48, 80);

    // Painted Start Banner
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '900 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('START / FINISH', 0, yStart - 20);

    // Centerline Dashes along the Straight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 5;
    ctx.setLineDash([26, 22]);
    ctx.beginPath();
    ctx.moveTo(0, -450);
    ctx.lineTo(0, yStart - 40);
    ctx.moveTo(0, yStart + 420);
    ctx.lineTo(0, 700);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Dedicated Drift Skidpad Markings (West)
    const cx = -780;
    const cy = 0;

    ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, 320, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 126, 64, 0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.stroke();

    // Skidpad Tarmac Typography
    ctx.fillStyle = 'rgba(0, 242, 254, 0.45)';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DRIFT ZONE', cx, cy - 120);
    ctx.font = '800 16px sans-serif';
    ctx.fillText('360° SKIDPAD', cx, cy + 130);

    // 3. Autocross Zone Markings (East)
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 16]);
    ctx.strokeRect(400, -240, 440, 740);
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.font = '900 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AUTOCROSS ARENA', 620, -200);

    // Pit Stall Boxes & Numbers
    const px = -240;
    for (let y = -140; y <= 360; y += 125) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 10, y, 90, 85);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '700 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`BAY ${(y + 265) / 125}`, px + 55, y + 45);
    }

    ctx.restore();
  }

  private renderBarriers(ctx: CanvasRenderingContext2D) {
    for (const b of this.barriers) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(-b.w / 2 + 5, -b.h / 2 + 5, b.w, b.h);

      // Concrete Pit Wall
      ctx.fillStyle = '#334155';
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);

      ctx.restore();
    }
  }

  private renderCones(ctx: CanvasRenderingContext2D) {
    for (const cone of this.cones) {
      if (cone.state === 'hidden' || cone.opacity <= 0.01) continue;

      ctx.save();
      ctx.globalAlpha = cone.opacity;
      ctx.translate(cone.x, cone.y);
      ctx.rotate(cone.angle);

      // Drop shadow (elongates if flying)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      const shadowScale = cone.state === 'flying' ? 1.3 : 1.0;
      ctx.ellipse(3, 4, cone.radius * shadowScale, cone.radius * 0.6 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cone Base
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(0, 0, cone.radius, 0, Math.PI * 2);
      ctx.fill();

      // Reflective White Ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, cone.radius * 0.58, 0, Math.PI * 2);
      ctx.fill();

      // Center Tip Dot
      ctx.fillStyle = '#d84315';
      ctx.beginPath();
      ctx.arc(0, 0, cone.radius * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderLeaves(ctx: CanvasRenderingContext2D) {
    for (const p of this.leafParticles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderTrees(ctx: CanvasRenderingContext2D) {
    for (const tree of this.trees) {
      ctx.save();
      ctx.translate(tree.x, tree.y);

      // 1. Soft tree shadow on ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(tree.canopyRadius * 0.35, tree.canopyRadius * 0.4, tree.canopyRadius * 1.15, tree.canopyRadius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Solid Wood Trunk (Visible at base)
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, 0, tree.trunkRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#291002';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Foliage Base Canopy (Darkest)
      ctx.fillStyle = tree.color;
      ctx.beginPath();
      ctx.arc(0, 0, tree.canopyRadius, 0, Math.PI * 2);
      ctx.fill();

      // 4. Middle Foliage Highlight Layer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.beginPath();
      ctx.arc(-tree.canopyRadius * 0.18, -tree.canopyRadius * 0.18, tree.canopyRadius * 0.72, 0, Math.PI * 2);
      ctx.fill();

      // 5. Crown Highlight (Sun reflection)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.arc(-tree.canopyRadius * 0.28, -tree.canopyRadius * 0.28, tree.canopyRadius * 0.42, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderBoundaryWalls(ctx: CanvasRenderingContext2D) {
    const { minX, maxX, minY, maxY } = this.bounds;
    const wallDepth = 26;
    const w = maxX - minX;
    const h = maxY - minY;

    ctx.save();

    // Red & White Rumble Curbs immediately inside outer boundary
    this.renderLinearCurb(ctx, minX, minY, w, wallDepth, true);
    this.renderLinearCurb(ctx, minX, maxY - wallDepth, w, wallDepth, true);
    this.renderLinearCurb(ctx, minX, minY, wallDepth, h, false);
    this.renderLinearCurb(ctx, maxX - wallDepth, minY, wallDepth, h, false);

    // Solid concrete outer perimeter blocks with yellow warning outline
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;

    ctx.fillRect(minX, minY, w, 14);
    ctx.strokeRect(minX, minY, w, 14);

    ctx.fillRect(minX, maxY - 14, w, 14);
    ctx.strokeRect(minX, maxY - 14, w, 14);

    ctx.fillRect(minX, minY, 14, h);
    ctx.strokeRect(minX, minY, 14, h);

    ctx.fillRect(maxX - 14, minY, 14, h);
    ctx.strokeRect(maxX - 14, minY, 14, h);

    ctx.restore();
  }
}
