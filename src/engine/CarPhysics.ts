import { CarPhysicsConfig } from '../stores/useCarConfigStore';

export interface WheelPosition {
  x: number;
  y: number;
  isFront: boolean;
  isLeft: boolean;
}

export class CarPhysics {
  // World Transform
  x: number = 0;
  y: number = 0;
  angle: number = -Math.PI / 2; // Initial heading: pointing North (Up)

  // Velocity vectors
  vx: number = 0;
  vy: number = 0;
  angularVelocity: number = 0;

  // Car Dimensions (in canvas pixels)
  readonly length: number = 64;
  readonly width: number = 32;
  readonly wheelBase: number = 44;
  readonly trackWidth: number = 28;

  // Dynamic state
  speed: number = 0;
  lateralVelocity: number = 0;
  longitudinalVelocity: number = 0;
  slipAngle: number = 0; // In radians
  isDrifting: boolean = false;
  frontWheelSteerAngle: number = 0;

  // Ground displacement tracking
  lastX: number = 0;
  lastY: number = 0;
  displacementSpeed: number = 0;

  constructor(startX: number = 0, startY: number = 0, startAngle: number = -Math.PI / 2) {
    this.x = startX;
    this.y = startY;
    this.lastX = startX;
    this.lastY = startY;
    this.angle = startAngle;
  }

  public reset(x: number = 0, y: number = 0, angle: number = -Math.PI / 2) {
    this.x = x;
    this.y = y;
    this.lastX = x;
    this.lastY = y;
    this.angle = angle;
    this.vx = 0;
    this.vy = 0;
    this.angularVelocity = 0;
    this.speed = 0;
    this.displacementSpeed = 0;
    this.lateralVelocity = 0;
    this.longitudinalVelocity = 0;
    this.slipAngle = 0;
    this.isDrifting = false;
    this.frontWheelSteerAngle = 0;
  }

  /**
   * Updates vehicle dynamics given delta time (in seconds) and control inputs:
   * @param dt Delta time in seconds
   * @param throttle Input in range [-1..1] (positive = forward, negative = reverse/brake)
   * @param steer Input in range [-1..1] (negative = left, positive = right)
   * @param config Physics tuning constants
   */
  public update(dt: number, throttle: number, steer: number, config: CarPhysicsConfig) {
    if (dt <= 0) return;

    // 1. Forward and right unit vectors from current heading
    const forwardX = Math.cos(this.angle);
    const forwardY = Math.sin(this.angle);
    const rightX = -Math.sin(this.angle);
    const rightY = Math.cos(this.angle);

    // 2. Project velocity into car local frame
    this.longitudinalVelocity = this.vx * forwardX + this.vy * forwardY;
    this.lateralVelocity = this.vx * rightX + this.vy * rightY;
    this.speed = Math.hypot(this.vx, this.vy);

    // 3. Engine acceleration / braking
    let accelForce = 0;
    if (throttle > 0) {
      // Forward throttle
      if (this.longitudinalVelocity < config.maxSpeed) {
        accelForce = throttle * config.acceleration;
      }
    } else if (throttle < 0) {
      // Reverse or braking
      if (this.longitudinalVelocity > 10) {
        // Active brake
        accelForce = throttle * config.braking;
      } else if (this.longitudinalVelocity > -config.reverseSpeed) {
        // Reverse
        accelForce = throttle * (config.acceleration * 0.55);
      }
    }

    // Apply acceleration along heading
    this.longitudinalVelocity += accelForce * dt;

    // Apply natural rolling resistance / drag
    this.longitudinalVelocity *= Math.pow(config.naturalDrag, dt * 60);

    // 4. Lateral friction, induced cornering drag, and drift scrub
    // Lateral velocity decay determines tire grip
    const driftDecay = Math.pow(config.driftFactor, dt * 60);
    this.lateralVelocity *= driftDecay;

    // Tire scrub: sliding sideways (drift) or hard steering bleeds off longitudinal speed.
    // In real driving, sliding tires generate heavy friction opposing forward motion.
    const slipSpeed = Math.abs(this.lateralVelocity);
    const steerScrub = Math.abs(steer) * 0.18; // Resistance from steered front wheels
    const driftScrub = Math.min(0.80, (slipSpeed / Math.max(80, config.maxSpeed * 0.35)) * 0.70);
    const totalScrub = Math.min(0.85, steerScrub + driftScrub);

    if (totalScrub > 0.04) {
      const scrubDecel = totalScrub * config.acceleration * 0.95;
      if (this.longitudinalVelocity > 0) {
        this.longitudinalVelocity = Math.max(0, this.longitudinalVelocity - scrubDecel * dt);
      } else if (this.longitudinalVelocity < 0) {
        this.longitudinalVelocity = Math.min(0, this.longitudinalVelocity + scrubDecel * dt);
      }
    }

    // 5. Steering logic
    this.frontWheelSteerAngle = steer * 0.55; // max ~31 degrees front wheel angle

    // Turning authority depends on vehicle motion
    // At very low speeds, steer smoothly without stationary spinning
    const speedRatio = Math.min(Math.abs(this.longitudinalVelocity) / 60, 1.0);
    const reverseMultiplier = this.longitudinalVelocity < -5 ? -1 : 1;
    const targetAngularVelocity = steer * config.steerRate * speedRatio * reverseMultiplier;

    // Smooth angular velocity towards target
    this.angularVelocity += (targetAngularVelocity - this.angularVelocity) * Math.min(1.0, 12 * dt);
    this.angularVelocity *= Math.pow(config.angularDrag, dt * 60);

    // 6. Reconstruct world velocity
    this.vx = forwardX * this.longitudinalVelocity + rightX * this.lateralVelocity;
    this.vy = forwardY * this.longitudinalVelocity + rightY * this.lateralVelocity;

    // 7. Integrate position and heading
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.angularVelocity * dt;

    // Normalize angle to [-PI, PI]
    this.angle = Math.atan2(Math.sin(this.angle), Math.cos(this.angle));
    this.speed = Math.hypot(this.vx, this.vy);

    // 8. Calculate slip angle for tire skid marks and telemetry
    const minDriftSpeed = Math.min(45, config.maxSpeed * 0.18);
    if (this.speed > 15) {
      const headingVelocityAngle = Math.atan2(this.vy, this.vx);
      let angleDiff = Math.abs(this.angle - headingVelocityAngle);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);
      this.slipAngle = angleDiff;
      this.isDrifting = angleDiff > 0.28 && this.speed > minDriftSpeed;
    } else {
      this.slipAngle = 0;
      this.isDrifting = false;
    }
  }

  /**
   * Returns world coordinates of all 4 wheels for rendering and skid mark generation
   */
  public getWheelPositions(): WheelPosition[] {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    const halfWheelBase = this.wheelBase / 2;
    const halfTrack = this.trackWidth / 2;

    const wheels: { fwd: number; side: number; isFront: boolean; isLeft: boolean }[] = [
      { fwd: halfWheelBase, side: -halfTrack, isFront: true, isLeft: true },   // Front-Left
      { fwd: halfWheelBase, side: halfTrack, isFront: true, isLeft: false },   // Front-Right
      { fwd: -halfWheelBase, side: -halfTrack, isFront: false, isLeft: true }, // Rear-Left
      { fwd: -halfWheelBase, side: halfTrack, isFront: false, isLeft: false }, // Rear-Right
    ];

    return wheels.map((w) => ({
      x: this.x + w.fwd * cos - w.side * sin,
      y: this.y + w.fwd * sin + w.side * cos,
      isFront: w.isFront,
      isLeft: w.isLeft
    }));
  }

  /**
   * Returns the world coordinate of the car's rear bumper center
   */
  public getRearBumperPosition(offset: number = 32): { x: number; y: number } {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    return {
      x: this.x - offset * cos,
      y: this.y - offset * sin
    };
  }
}
