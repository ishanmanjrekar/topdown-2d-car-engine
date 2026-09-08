import { CarPhysics } from './CarPhysics';

export type SurfaceType = 'asphalt' | 'curb' | 'grass' | 'gravel';

export interface SurfaceProperties {
  type: SurfaceType;
  gripMultiplier: number; // 1.0 = normal asphalt, < 1.0 = slippery grass
  dragMultiplier: number; // 1.0 = normal rolling drag, > 1.0 = off-track slowdown
}

export interface TrackBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ITrack {
  bounds: TrackBounds;

  /**
   * Updates dynamic track elements (flying cones, respawn timers, trackside animations)
   */
  update(dt: number, car: CarPhysics): void;

  /**
   * Resolves physical collisions between the vehicle and track boundaries,
   * solid obstacles (trees, barriers), and dynamic props (cones).
   */
  checkCollisions(car: CarPhysics, dt: number): void;

  /**
   * Returns surface grip and drag properties at the specified world coordinate
   */
  getSurfaceAt?(x: number, y: number): SurfaceProperties;

  /**
   * Renders the world, road surfaces, markings, barriers, props, and foliage
   */
  render(ctx: CanvasRenderingContext2D, camX: number, camY: number, viewW: number, viewH: number): void;

  /**
   * Resets all dynamic track props to their initial spawn states
   */
  reset(): void;
}
