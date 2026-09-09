import { describe, it, expect, beforeEach } from 'vitest';
import { RearTouchController } from '../RearTouchController';
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

describe('RearTouchController', () => {
  let controller: RearTouchController;
  let car: CarPhysics;

  beforeEach(() => {
    controller = new RearTouchController();
    car = new CarPhysics(0, 0, -Math.PI / 2); // Facing North / Up
  });

  it('outputs zero throttle and steer when not touching', () => {
    controller.setTouch(false);
    controller.update(car, mockConfig);

    expect(controller.throttle).toBe(0);
    expect(controller.steer).toBe(0);
    expect(controller.gizmo.isActive).toBe(false);
  });

  it('outputs forward throttle when touching behind rear bumper anchor', () => {
    // Car is at (0, 0) facing North (-PI/2).
    // Forward vector is (0, -1). Rear anchor (55px behind) is at (0, +55).
    // Touching at (0, 110) is 55px behind the anchor (beyond deadzone of 10px).
    controller.setTouch(true, 0, 110);
    controller.update(car, mockConfig);

    expect(controller.throttle).toBeGreaterThan(0);
    expect(controller.throttle).toBeLessThanOrEqual(1.0);
    expect(controller.steer).toBe(0);
    expect(controller.gizmo.isActive).toBe(true);
  });

  it('outputs negative throttle (braking/reverse) when touching ahead of rear anchor', () => {
    // Touching at (0, 0) is 55px ahead of anchor (towards vehicle cabin)
    controller.setTouch(true, 0, 0);
    controller.update(car, mockConfig);

    expect(controller.throttle).toBeLessThan(0);
    expect(controller.throttle).toBeGreaterThanOrEqual(-1.0);
  });

  it('outputs steering torque when finger is laterally offset', () => {
    // Touch 55px behind anchor (0, 110) and shifted to the right (+40, 110)
    // Right unit vector for car facing North is (+1, 0).
    // In counter-rotational push steering, touching right pushes tail right -> turns nose left (negative steer).
    controller.setTouch(true, 40, 110);
    controller.update(car, mockConfig);

    expect(controller.throttle).toBeGreaterThan(0);
    expect(controller.steer).toBeLessThan(0);
  });

  it('inverts steering when invertSteer is enabled', () => {
    const invertedConfig = { ...mockConfig, invertSteer: true };
    controller.setTouch(true, 40, 110);
    controller.update(car, invertedConfig);

    expect(controller.steer).toBeGreaterThan(0);
  });

  it('respects deadzone to prevent straight-line wobble', () => {
    // Touch within deadzone radius (5px from anchor at 0, 55)
    controller.setTouch(true, 2, 58);
    controller.update(car, mockConfig);

    expect(controller.throttle).toBe(0);
    expect(controller.steer).toBe(0);
  });
});
