import { describe, it, expect, beforeEach } from 'vitest';
import { CarPhysics } from '../CarPhysics';
import { CarPhysicsConfig } from '../../stores/useCarConfigStore';

const mockConfig: CarPhysicsConfig = {
  maxSpeed: 460,
  acceleration: 480,
  reverseSpeed: 180,
  braking: 600,
  naturalDrag: 0.982,
  steerRate: 3.8,
  driftFactor: 0.93,
  angularDrag: 0.88,
  rearAnchorDistance: 55,
  rearPushRadius: 110,
  rearSteerMaxOffset: 85,
  rearDeadzone: 10,
  invertSteer: false,
  showDebugVectors: false,
  showTireTracks: true,
  showTouchGizmo: false,
  carColor: '#00f2fe'
};

describe('CarPhysics', () => {
  let car: CarPhysics;

  beforeEach(() => {
    car = new CarPhysics(0, 0, -Math.PI / 2); // Initial heading: pointing North (Up)
  });

  it('initializes with expected default values', () => {
    expect(car.x).toBe(0);
    expect(car.y).toBe(0);
    expect(car.angle).toBeCloseTo(-Math.PI / 2, 4);
    expect(car.speed).toBe(0);
    expect(car.isDrifting).toBe(false);
  });

  it('accelerates forward when positive throttle is applied', () => {
    const dt = 1 / 60;
    // Step for 0.5s at full throttle
    for (let i = 0; i < 30; i++) {
      car.update(dt, 1.0, 0, mockConfig);
    }

    // Car heading North (Up) means forward motion moves along -Y in Canvas coords
    expect(car.speed).toBeGreaterThan(50);
    expect(car.longitudinalVelocity).toBeGreaterThan(50);
    expect(car.y).toBeLessThan(0);
    expect(car.x).toBeCloseTo(0, 2);
  });

  it('decelerates with active braking force', () => {
    const dt = 1 / 60;
    // Build speed first
    for (let i = 0; i < 30; i++) {
      car.update(dt, 1.0, 0, mockConfig);
    }
    const peakSpeed = car.speed;

    // Apply active braking
    for (let i = 0; i < 15; i++) {
      car.update(dt, -1.0, 0, mockConfig);
    }

    expect(car.speed).toBeLessThan(peakSpeed * 0.5);
  });

  it('steers in reverse with realistic inverted direction', () => {
    const dt = 1 / 60;
    // Accelerate backwards into reverse gear
    for (let i = 0; i < 30; i++) {
      car.update(dt, -1.0, 0, mockConfig);
    }
    expect(car.longitudinalVelocity).toBeLessThan(-10);

    // Steer right while in reverse
    car.update(dt, -1.0, 1.0, mockConfig);
    // Reversing with right steering turns the nose opposite to forward steering
    expect(car.angularVelocity).toBeLessThan(0);
  });

  it('resets state accurately', () => {
    const dt = 1 / 60;
    car.update(dt, 1.0, 0.5, mockConfig);
    car.reset(100, 200, 0);

    expect(car.x).toBe(100);
    expect(car.y).toBe(200);
    expect(car.angle).toBe(0);
    expect(car.speed).toBe(0);
    expect(car.angularVelocity).toBe(0);
  });

  it('provides preallocated wheel buffer with correct geometric offsets', () => {
    const wheels = car.getWheelPositions();
    expect(wheels.length).toBe(4);

    // Front wheels should be further ahead along heading than rear wheels
    // Heading is -PI/2 (pointing up, so ahead means smaller Y)
    expect(wheels[0].y).toBeLessThan(wheels[2].y);
    expect(wheels[1].y).toBeLessThan(wheels[3].y);

    // Left wheels should be to the left of right wheels
    expect(wheels[0].x).toBeLessThan(wheels[1].x);
    expect(wheels[2].x).toBeLessThan(wheels[3].x);

    // Verify mutating buffer in-place returns the same array instance (zero allocation)
    const wheels2 = car.getWheelPositions();
    expect(wheels).toBe(wheels2);
  });
});
