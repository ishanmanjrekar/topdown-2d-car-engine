export class Camera {
  public x: number = 0;
  public y: number = 0;
  public rotation: number = 0; // Camera rotation in radians
  public zoom: number = 1.0;
  public viewportWidth: number = 480;
  public viewportHeight: number = 880;

  // Car screen anchor: 0.60 places car at 60% from top, giving 40% bottom finger space
  public anchorYFactor: number = 0.60;

  // Camera damping factors
  public smoothness: number = 7.5;
  public rotationSmoothness: number = 8.0;
  // Lookahead distance proportional to speed
  public lookaheadFactor: number = 0.22;

  constructor(startX: number = 0, startY: number = 0, startAngle: number = -Math.PI / 2) {
    this.x = startX;
    this.y = startY;
    this.rotation = startAngle + Math.PI / 2;
  }

  public setViewport(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  public reset(x: number = 0, y: number = 0, angle: number = -Math.PI / 2) {
    this.x = x;
    this.y = y;
    this.rotation = angle + Math.PI / 2;
  }

  public update(targetX: number, targetY: number, targetAngle: number, vx: number, vy: number, dt: number) {
    if (dt <= 0) return;

    // 1. Smoothly track car position with velocity lookahead
    const speed = Math.hypot(vx, vy);
    const destX = targetX + Math.cos(targetAngle) * Math.min(speed, 250) * this.lookaheadFactor;
    const destY = targetY + Math.sin(targetAngle) * Math.min(speed, 250) * this.lookaheadFactor;

    const t = 1.0 - Math.exp(-this.smoothness * dt);
    this.x += (destX - this.x) * t;
    this.y += (destY - this.y) * t;

    // 2. Smoothly track car heading so car is always oriented pointing UP on screen
    // Car points UP when car.angle = -PI/2.
    // Target camera rotation aligns car heading to screen UP axis:
    const targetCamAngle = targetAngle + Math.PI / 2;
    let angleDiff = (targetCamAngle - this.rotation) % (Math.PI * 2);
    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const rotT = 1.0 - Math.exp(-this.rotationSmoothness * dt);
    this.rotation += angleDiff * rotT;
  }

  /**
   * Applies camera transform matrix to canvas context:
   * 1. Translates to bottom-third screen anchor
   * 2. Scales by zoom
   * 3. Rotates world so car always faces UP
   * 4. Translates world coordinates
   */
  public applyTransform(ctx: CanvasRenderingContext2D) {
    ctx.translate(this.viewportWidth / 2, this.viewportHeight * this.anchorYFactor);
    ctx.scale(this.zoom, this.zoom);
    ctx.rotate(-this.rotation);
    ctx.translate(-this.x, -this.y);
  }

  /**
   * Converts screen (canvas client) coordinate to world coordinate
   */
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    // 1. Uncenter from bottom-third anchor
    const centeredX = (screenX - this.viewportWidth / 2) / this.zoom;
    const centeredY = (screenY - this.viewportHeight * this.anchorYFactor) / this.zoom;

    // 2. Unrotate by +this.rotation
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    const rotatedX = centeredX * cos - centeredY * sin;
    const rotatedY = centeredX * sin + centeredY * cos;

    // 3. Translate by world camera position
    return {
      x: rotatedX + this.x,
      y: rotatedY + this.y
    };
  }

  /**
   * Converts world coordinate to screen coordinate
   */
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const dx = worldX - this.x;
    const dy = worldY - this.y;

    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;

    return {
      x: rotatedX * this.zoom + this.viewportWidth / 2,
      y: rotatedY * this.zoom + this.viewportHeight * this.anchorYFactor
    };
  }
}
