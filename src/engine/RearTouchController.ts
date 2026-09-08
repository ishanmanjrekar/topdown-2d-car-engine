import { CarPhysics } from './CarPhysics';
import { CarPhysicsConfig } from '../stores/useCarConfigStore';

export interface RearTouchGizmo {
  isActive: boolean;
  anchorWorldX: number;
  anchorWorldY: number;
  touchWorldX: number;
  touchWorldY: number;
  carHeading: number;
  throttle: number;
  steer: number;
  pushDistance: number;
  lateralOffset: number;
}

export class RearTouchController {
  public isTouching: boolean = false;
  public touchWorldX: number = 0;
  public touchWorldY: number = 0;

  public throttle: number = 0;
  public steer: number = 0;

  public gizmo: RearTouchGizmo = {
    isActive: false,
    anchorWorldX: 0,
    anchorWorldY: 0,
    touchWorldX: 0,
    touchWorldY: 0,
    carHeading: 0,
    throttle: 0,
    steer: 0,
    pushDistance: 0,
    lateralOffset: 0
  };

  public setTouch(active: boolean, worldX: number = 0, worldY: number = 0) {
    this.isTouching = active;
    this.touchWorldX = worldX;
    this.touchWorldY = worldY;
  }

  /**
   * Updates control signals by projecting the touch point against the vehicle's rear anchor
   */
  public update(car: CarPhysics, config: CarPhysicsConfig) {
    if (!this.isTouching) {
      this.throttle = 0;
      this.steer = 0;
      this.gizmo.isActive = false;
      return;
    }

    const cos = Math.cos(car.angle);
    const sin = Math.sin(car.angle);

    // Forward and Right unit vectors
    const fwdX = cos;
    const fwdY = sin;
    const rightX = -sin;
    const rightY = cos;

    // 1. Calculate Rear Bumper Anchor Point in World Space
    const anchorX = car.x - config.rearAnchorDistance * fwdX;
    const anchorY = car.y - config.rearAnchorDistance * fwdY;

    // 2. Vector from anchor to active touch
    const dx = this.touchWorldX - anchorX;
    const dy = this.touchWorldY - anchorY;

    // 3. Project into vehicle local axes
    // deltaLong > 0 means touch is in front of anchor (towards vehicle cabin)
    // deltaLong < 0 means touch is behind anchor (pushing from behind)
    const deltaLong = dx * fwdX + dy * fwdY;
    const deltaLat = dx * rightX + dy * rightY;

    // 4. Throttle Calculation:
    // Pushing behind the vehicle (-deltaLong > 0) exerts forward drive force
    const pushBehindDist = -deltaLong;

    if (pushBehindDist > config.rearDeadzone) {
      // Forward throttle proportional to push distance behind rear bumper
      const effectiveDist = pushBehindDist - config.rearDeadzone;
      this.throttle = Math.min(effectiveDist / config.rearPushRadius, 1.0);
    } else if (pushBehindDist < -config.rearDeadzone) {
      // Finger is ahead of the rear bumper: apply reverse / brake
      const brakeDist = Math.abs(pushBehindDist) - config.rearDeadzone;
      this.throttle = -Math.min(brakeDist / (config.rearPushRadius * 0.75), 1.0);
    } else {
      this.throttle = 0;
    }

    // 5. Steering Calculation:
    // In rear-touch push steering, touching to the right of the car pushes the rear right,
    // which turns the car to the left (counter-rotation like swinging a tail).
    // If finger is to the right (deltaLat > 0), steer is negative (left).
    let rawSteer = 0;
    if (Math.abs(deltaLat) > config.rearDeadzone) {
      const sign = Math.sign(deltaLat);
      const effectiveLat = Math.abs(deltaLat) - config.rearDeadzone;
      rawSteer = -sign * Math.min(effectiveLat / config.rearSteerMaxOffset, 1.0);
      if (config.invertSteer) {
        rawSteer = -rawSteer;
      }
    }
    this.steer = rawSteer;

    // 6. Update gizmo telemetry for debug HUD & canvas overlay
    this.gizmo = {
      isActive: true,
      anchorWorldX: anchorX,
      anchorWorldY: anchorY,
      touchWorldX: this.touchWorldX,
      touchWorldY: this.touchWorldY,
      carHeading: car.angle,
      throttle: this.throttle,
      steer: this.steer,
      pushDistance: pushBehindDist,
      lateralOffset: deltaLat
    };
  }
}
