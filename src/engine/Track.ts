import { CarPhysics } from './CarPhysics';

export interface Cone {
  x: number;
  y: number;
  radius: number;
  hit: boolean;
}

export interface Tree {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface Billboard {
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
  text: string;
  color: string;
}

export class Track {
  public cones: Cone[] = [];
  public trees: Tree[] = [];
  public billboards: Billboard[] = [];

  // Playable Arena Bounding Box - Car is physically constrained within this perimeter
  public bounds = {
    minX: -1300,
    maxX: 1300,
    minY: -1300,
    maxY: 1300
  };

  constructor() {
    this.initCones();
    this.initWorldElements();
  }

  private initCones() {
    this.cones = [];

    // Slalom Course down the center
    for (let y = -600; y <= 600; y += 140) {
      this.cones.push({ x: 0, y, radius: 10, hit: false });
    }

    // Skid Pad Ring (Drift circle on the left)
    const ringRadius = 380;
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.cones.push({
        x: -680 + Math.cos(angle) * ringRadius,
        y: Math.sin(angle) * ringRadius,
        radius: 10,
        hit: false
      });
    }

    // Hairpin chicane cones on the right
    const chicanePoints = [
      { x: 550, y: -450 },
      { x: 720, y: -250 },
      { x: 550, y: 0 },
      { x: 720, y: 250 },
      { x: 550, y: 450 }
    ];
    for (const pt of chicanePoints) {
      this.cones.push({ x: pt.x, y: pt.y, radius: 10, hit: false });
    }
  }

  private initWorldElements() {
    // Trees scattered outside track boundaries and in green islands
    this.trees = [
      // Top boundary grove
      { x: -900, y: -1150, radius: 38, color: '#166534' },
      { x: -650, y: -1180, radius: 44, color: '#15803d' },
      { x: -400, y: -1140, radius: 36, color: '#14532d' },
      { x: 200, y: -1160, radius: 42, color: '#166534' },
      { x: 500, y: -1170, radius: 48, color: '#15803d' },
      { x: 800, y: -1140, radius: 38, color: '#14532d' },
      { x: 1050, y: -1150, radius: 45, color: '#166534' },

      // Bottom boundary grove
      { x: -1000, y: 1150, radius: 42, color: '#14532d' },
      { x: -600, y: 1160, radius: 48, color: '#15803d' },
      { x: -300, y: 1140, radius: 36, color: '#166534' },
      { x: 300, y: 1170, radius: 44, color: '#15803d' },
      { x: 700, y: 1150, radius: 40, color: '#14532d' },
      { x: 1000, y: 1160, radius: 46, color: '#166534' },

      // Left boundary grove
      { x: -1160, y: -800, radius: 40, color: '#166534' },
      { x: -1180, y: -400, radius: 46, color: '#15803d' },
      { x: -1150, y: 0, radius: 44, color: '#14532d' },
      { x: -1170, y: 400, radius: 42, color: '#166534' },
      { x: -1150, y: 800, radius: 48, color: '#15803d' },

      // Right boundary grove
      { x: 1160, y: -700, radius: 44, color: '#15803d' },
      { x: 1180, y: -200, radius: 38, color: '#14532d' },
      { x: 1150, y: 300, radius: 46, color: '#166534' },
      { x: 1170, y: 750, radius: 42, color: '#15803d' },

      // Skidpad Center Island Tree
      { x: -680, y: 0, radius: 52, color: '#15803d' },

      // Chicane infield trees
      { x: 920, y: -250, radius: 42, color: '#166534' },
      { x: 920, y: 250, radius: 44, color: '#14532d' }
    ];

    // Trackside Sponsor Billboards / Containers
    this.billboards = [
      { x: -300, y: -850, w: 140, h: 28, angle: 0, text: 'APEX RACING', color: '#00f2fe' },
      { x: 300, y: -850, w: 140, h: 28, angle: 0, text: 'OVERSTEER', color: '#ff3366' },
      { x: -300, y: 850, w: 140, h: 28, angle: 0, text: 'TURBO DRIFT', color: '#ffb703' },
      { x: 300, y: 850, w: 140, h: 28, angle: 0, text: 'OCTANE 100', color: '#39ff14' },
      { x: -1100, y: 250, w: 130, h: 28, angle: Math.PI / 2, text: 'SKIDPAD ZONE', color: '#00f2fe' },
      { x: 1100, y: -150, w: 130, h: 28, angle: -Math.PI / 2, text: 'HAIRPIN CHICANE', color: '#ff3366' }
    ];
  }

  /**
   * Enforces physics bounding box: prevents the car from escaping into the void
   */
  public checkWallCollision(car: CarPhysics) {
    const margin = 34; // Half car length + wall curb depth
    const bounce = 0.45; // Restitution bounce factor
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

  public checkConeCollision(carX: number, carY: number, carRadius: number = 26) {
    for (const cone of this.cones) {
      const dist = Math.hypot(carX - cone.x, carY - cone.y);
      if (dist < carRadius + cone.radius) {
        cone.hit = true;
      }
    }
  }

  public resetCones() {
    for (const cone of this.cones) {
      cone.hit = false;
    }
  }

  /**
   * Main World Rendering: Draw grass surroundings, asphalt track, ground graphics,
   * starting grid, billboards, trees, cones, and boundary barrier walls.
   */
  public render(ctx: CanvasRenderingContext2D, camX: number, camY: number, viewW: number, viewH: number) {
    const radius = Math.hypot(viewW, viewH) * 1.35;
    const startX = camX - radius;
    const endX = camX + radius;
    const startY = camY - radius;
    const endY = camY + radius;

    // -------------------------------------------------------------
    // 1. Surrounding Grass Lawn & Outside Void Background
    // -------------------------------------------------------------
    ctx.fillStyle = '#091e11'; // Lush dark grass green
    ctx.fillRect(startX, startY, endX - startX, endY - startY);

    // Subtle lawn stripes
    const lawnStripeSize = 160;
    const lawnStartY = Math.floor(startY / lawnStripeSize) * lawnStripeSize;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let y = lawnStartY; y <= endY; y += lawnStripeSize * 2) {
      ctx.fillRect(startX, y, endX - startX, lawnStripeSize);
    }

    // -------------------------------------------------------------
    // 2. Playable Asphalt Ground Arena
    // -------------------------------------------------------------
    const arenaW = this.bounds.maxX - this.bounds.minX;
    const arenaH = this.bounds.maxY - this.bounds.minY;

    // Tarmac shadow on grass
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.bounds.minX - 8, this.bounds.minY - 8, arenaW + 16, arenaH + 16);

    // Main dark asphalt base
    ctx.fillStyle = '#11141e';
    ctx.fillRect(this.bounds.minX, this.bounds.minY, arenaW, arenaH);

    // Grid coordinates lines on tarmac for clear speed & distance perception
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const gridSize = 100;
    const gridStartX = Math.max(this.bounds.minX, Math.floor(startX / gridSize) * gridSize);
    const gridEndX = Math.min(this.bounds.maxX, Math.ceil(endX / gridSize) * gridSize);
    const gridStartY = Math.max(this.bounds.minY, Math.floor(startY / gridSize) * gridSize);
    const gridEndY = Math.min(this.bounds.maxY, Math.ceil(endY / gridSize) * gridSize);

    for (let x = gridStartX; x <= gridEndX; x += gridSize) {
      ctx.moveTo(x, this.bounds.minY);
      ctx.lineTo(x, this.bounds.maxY);
    }
    for (let y = gridStartY; y <= gridEndY; y += gridSize) {
      ctx.moveTo(this.bounds.minX, y);
      ctx.lineTo(this.bounds.maxX, y);
    }
    ctx.stroke();
    ctx.restore();

    // -------------------------------------------------------------
    // 3. Ground Markings & Circuit Art
    // -------------------------------------------------------------
    ctx.save();

    // A. Center Drag Strip / Straightaway
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.fillRect(-120, -900, 240, 1800);

    // White dashed center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 6;
    ctx.setLineDash([24, 20]);
    ctx.beginPath();
    ctx.moveTo(0, -900);
    ctx.lineTo(0, 900);
    ctx.stroke();
    ctx.setLineDash([]);

    // B. Start / Finish Line & Starting Grid
    this.renderStartFinishGrid(ctx);

    // C. Directional Asphalt Arrows
    this.renderRoadArrow(ctx, 0, -350, -Math.PI / 2, 40);
    this.renderRoadArrow(ctx, 0, 50, -Math.PI / 2, 40);
    this.renderRoadArrow(ctx, 0, 450, -Math.PI / 2, 40);

    // D. Skid Pad Arena (Left)
    this.renderSkidpad(ctx);

    // E. Hairpin Chicane Markings (Right)
    this.renderChicaneMarkings(ctx);

    // F. Pit Lane Bay on Right side
    this.renderPitLane(ctx);

    ctx.restore();

    // -------------------------------------------------------------
    // 4. Cones
    // -------------------------------------------------------------
    this.renderCones(ctx);

    // -------------------------------------------------------------
    // 5. Billboards & Sponsor Containers
    // -------------------------------------------------------------
    this.renderBillboards(ctx);

    // -------------------------------------------------------------
    // 6. Perimeter Barrier Walls & Rumble Curbs (Physical Bounding Box)
    // -------------------------------------------------------------
    this.renderBoundaryWalls(ctx);

    // -------------------------------------------------------------
    // 7. Trees with Foliage & Drop Shadows
    // -------------------------------------------------------------
    this.renderTrees(ctx);
  }

  private renderStartFinishGrid(ctx: CanvasRenderingContext2D) {
    const yStart = 200;

    // Checkered Start/Finish Stripe
    const checkSize = 16;
    const checkWidth = 240;
    const startX = -checkWidth / 2;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < checkWidth / checkSize; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#11141e';
        ctx.fillRect(startX + col * checkSize, yStart + row * checkSize, checkSize, checkSize);
      }
    }

    // Yellow Starting Grid Boxes for 4 Cars
    ctx.strokeStyle = 'rgba(255, 235, 59, 0.6)';
    ctx.lineWidth = 3;

    // Grid Slot #1 (Pole position)
    ctx.strokeRect(-55, yStart - 120, 45, 75);
    // Grid Slot #2
    ctx.strokeRect(15, yStart - 70, 45, 75);
    // Grid Slot #3
    ctx.strokeRect(-55, yStart + 60, 45, 75);
    // Grid Slot #4
    ctx.strokeRect(15, yStart + 110, 45, 75);

    // Painted Start Line Banner text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('START / FINISH', 0, yStart - 10);
  }

  private renderRoadArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';

    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size * 0.35, size * 0.1);
    ctx.lineTo(size * 0.12, size * 0.1);
    ctx.lineTo(size * 0.12, size * 0.5);
    ctx.lineTo(-size * 0.12, size * 0.5);
    ctx.lineTo(-size * 0.12, size * 0.1);
    ctx.lineTo(-size * 0.35, size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private renderSkidpad(ctx: CanvasRenderingContext2D) {
    const cx = -680;
    const cy = 0;

    // Outer and Inner cyan drift rings
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, 380, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 242, 254, 0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 220, 0, Math.PI * 2);
    ctx.stroke();

    // Center Donut Target Ring
    ctx.strokeStyle = 'rgba(255, 126, 64, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 100, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 380, cy);
    ctx.lineTo(cx + 380, cy);
    ctx.moveTo(cx, cy - 380);
    ctx.lineTo(cx, cy + 380);
    ctx.stroke();

    // Painted DRIFT ZONE Label on Tarmac
    ctx.fillStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '4px';
    ctx.fillText('DRIFT ZONE', cx, cy - 140);
    ctx.font = '800 16px sans-serif';
    ctx.fillText('360° SKIDPAD', cx, cy + 160);
  }

  private renderChicaneMarkings(ctx: CanvasRenderingContext2D) {
    // Chevron warning signs on right chicane
    const chevrons = [
      { x: 740, y: -250, angle: Math.PI / 4 },
      { x: 740, y: 250, angle: -Math.PI / 4 }
    ];

    ctx.fillStyle = 'rgba(255, 51, 102, 0.45)';
    ctx.font = '900 24px monospace';
    ctx.textAlign = 'center';
    for (const ch of chevrons) {
      ctx.save();
      ctx.translate(ch.x, ch.y);
      ctx.rotate(ch.angle);
      ctx.fillText('>>> CHICANE >>>', 0, 0);
      ctx.restore();
    }
  }

  private renderPitLane(ctx: CanvasRenderingContext2D) {
    const px = 280;
    // Pit divider solid yellow line
    ctx.strokeStyle = 'rgba(255, 235, 59, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px, -300);
    ctx.lineTo(px, 500);
    ctx.stroke();

    // Pit stall boxes
    for (let y = -200; y <= 400; y += 150) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.strokeRect(px + 20, y, 70, 100);

      // Pit Box text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '700 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`PIT ${(y + 350) / 150}`, px + 55, y + 55);
    }
  }

  private renderCones(ctx: CanvasRenderingContext2D) {
    for (const cone of this.cones) {
      ctx.save();
      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cone.x + 3, cone.y + 4, cone.radius, cone.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cone Base & Body
      ctx.fillStyle = cone.hit ? '#94a3b8' : '#ff5722';
      ctx.beginPath();
      ctx.arc(cone.x, cone.y, cone.radius, 0, Math.PI * 2);
      ctx.fill();

      // White ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cone.x, cone.y, cone.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Center orange dot
      ctx.fillStyle = cone.hit ? '#64748b' : '#d84315';
      ctx.beginPath();
      ctx.arc(cone.x, cone.y, cone.radius * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderBillboards(ctx: CanvasRenderingContext2D) {
    for (const b of this.billboards) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(-b.w / 2 + 5, -b.h / 2 + 6, b.w, b.h);

      // Container body
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);

      // Accent border
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);

      // Billboard text
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, 0, 0);

      ctx.restore();
    }
  }

  private renderTrees(ctx: CanvasRenderingContext2D) {
    for (const tree of this.trees) {
      ctx.save();
      ctx.translate(tree.x, tree.y);

      // 1. Soft tree shadow on ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(tree.radius * 0.35, tree.radius * 0.4, tree.radius * 1.1, tree.radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Base foliage canopy (Darkest layer)
      ctx.fillStyle = tree.color;
      ctx.beginPath();
      ctx.arc(0, 0, tree.radius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Middle foliage highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(-tree.radius * 0.15, -tree.radius * 0.15, tree.radius * 0.72, 0, Math.PI * 2);
      ctx.fill();

      // 4. Center top canopy highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(-tree.radius * 0.25, -tree.radius * 0.25, tree.radius * 0.42, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Renders the outer boundary crash barriers: red/white rumble strips, concrete blocks,
   * and yellow/black hazard warning stripes around the entire perimeter.
   */
  private renderBoundaryWalls(ctx: CanvasRenderingContext2D) {
    const { minX, maxX, minY, maxY } = this.bounds;
    const wallDepth = 26;
    const w = maxX - minX;
    const h = maxY - minY;

    ctx.save();

    // 1. Red & White Rumble Curbs immediately inside the wall
    this.renderCurb(ctx, minX, minY, w, wallDepth, true);
    this.renderCurb(ctx, minX, maxY - wallDepth, w, wallDepth, true);
    this.renderCurb(ctx, minX, minY, wallDepth, h, false);
    this.renderCurb(ctx, maxX - wallDepth, minY, wallDepth, h, false);

    // 2. Concrete Crash Barrier Blocks with Hazard Stripes
    this.renderHazardBarrier(ctx, minX, minY, w, 14);
    this.renderHazardBarrier(ctx, minX, maxY - 14, w, 14);
    this.renderHazardBarrier(ctx, minX, minY, 14, h);
    this.renderHazardBarrier(ctx, maxX - 14, minY, 14, h);

    ctx.restore();
  }

  private renderCurb(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, horizontal: boolean) {
    const segmentSize = 32;
    if (horizontal) {
      const count = Math.ceil(w / segmentSize);
      for (let i = 0; i < count; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#f8fafc';
        ctx.fillRect(x + i * segmentSize, y, Math.min(segmentSize, w - i * segmentSize), h);
      }
    } else {
      const count = Math.ceil(h / segmentSize);
      for (let i = 0; i < count; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#f8fafc';
        ctx.fillRect(x, y + i * segmentSize, w, Math.min(segmentSize, h - i * segmentSize));
      }
    }
  }

  private renderHazardBarrier(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    // Solid concrete barrier base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, w, h);

    // Neon Yellow Hazard Stripe line
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
  }
}
