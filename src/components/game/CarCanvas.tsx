import React, { useRef, useEffect, useCallback } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { CarPhysics } from '../../engine/CarPhysics';
import { RearTouchController } from '../../engine/RearTouchController';
import { ParticleSystem } from '../../engine/ParticleSystem';
import { Camera } from '../../engine/Camera';
import { Track } from '../../engine/Track';
import { useCarConfigStore } from '../../stores/useCarConfigStore';
import { useGameStore } from '../../stores/useGameStore';

export const CarCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Engine singletons stored in refs to avoid recreation
  const carRef = useRef<CarPhysics>(new CarPhysics(0, 200, -Math.PI / 2));
  const controllerRef = useRef<RearTouchController>(new RearTouchController());
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());
  const cameraRef = useRef<Camera>(new Camera(0, 200));
  const trackRef = useRef<Track>(new Track());

  // Input states for keyboard dev mode
  const keysRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false
  });

  // FPS tracking
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());

  // Store references
  const config = useCarConfigStore();
  const { controlMode, updateTelemetry, isPaused } = useGameStore();

  // Reset Car trigger
  const handleResetCar = useCallback(() => {
    carRef.current.reset(0, 200, -Math.PI / 2);
    if (typeof cameraRef.current?.reset === 'function') {
      cameraRef.current.reset(0, 200, -Math.PI / 2);
    } else {
      cameraRef.current.x = 0;
      cameraRef.current.y = 200;
      cameraRef.current.rotation = 0;
    }
    particlesRef.current.clear();
    trackRef.current.resetCones();
    controllerRef.current.setTouch(false);
  }, []);

  // Expose reset and debug state to window
  useEffect(() => {
    (window as any).__resetCarEngine = handleResetCar;
    (window as any).__carEngineState = () => ({
      car: {
        x: carRef.current.x,
        y: carRef.current.y,
        angle: carRef.current.angle,
        speed: carRef.current.speed,
        vx: carRef.current.vx,
        vy: carRef.current.vy,
      },
      camera: {
        x: cameraRef.current.x,
        y: cameraRef.current.y,
        vw: cameraRef.current.viewportWidth,
        vh: cameraRef.current.viewportHeight,
        zoom: cameraRef.current.zoom
      },
      canvas: canvasRef.current ? {
        width: canvasRef.current.width,
        height: canvasRef.current.height,
        styleW: canvasRef.current.style.width,
        styleH: canvasRef.current.style.height,
        clientWidth: canvasRef.current.clientWidth,
        clientHeight: canvasRef.current.clientHeight,
        parentClientW: canvasRef.current.parentElement?.clientWidth,
        parentClientH: canvasRef.current.parentElement?.clientHeight,
      } : null
    });
    return () => {
      delete (window as any).__resetCarEngine;
      delete (window as any).__carEngineState;
    };
  }, [handleResetCar]);

  // Keyboard controls listener (dev fallback)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.down = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
      if (e.code === 'KeyR') handleResetCar();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.down = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleResetCar]);

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || 480;
      const height = parent?.clientHeight || 880;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      cameraRef.current.setViewport(width, height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer / Touch Handlers for Rear-Touch Control
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePointerWorldPos(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (controllerRef.current.isTouching) {
      updatePointerWorldPos(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    controllerRef.current.setTouch(false);
  };

  const updatePointerWorldPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const parent = canvas.parentElement;
    const logicalW = parent?.clientWidth || 480;
    const logicalH = parent?.clientHeight || 880;

    // Correctly scale pointer coordinates from screen-space bounding rect to logical canvas pixels
    const scaleX = logicalW / rect.width;
    const scaleY = logicalH / rect.height;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;

    const world = cameraRef.current.screenToWorld(screenX, screenY);
    controllerRef.current.setTouch(true, world.x, world.y);
  };

  // Main Simulation & Render Loop
  useGameLoop((dtMs) => {
    if (isPaused) return;

    const dt = dtMs / 1000;
    const car = carRef.current;
    const controller = controllerRef.current;
    const particles = particlesRef.current;
    const camera = cameraRef.current;
    const track = trackRef.current;

    // 1. Determine Inputs
    let throttle = 0;
    let steer = 0;

    if (controlMode === 'rear-touch') {
      controller.update(car, config);
      throttle = controller.throttle;
      steer = controller.steer;

      // Also allow keyboard overlay during rear-touch mode for testing
      if (keysRef.current.up) throttle = 1;
      if (keysRef.current.down) throttle = -1;
      if (keysRef.current.left) steer = -1;
      if (keysRef.current.right) steer = 1;
    } else {
      // Keyboard / Manual mode
      if (keysRef.current.up) throttle = 1;
      if (keysRef.current.down) throttle = -1;
      if (keysRef.current.left) steer = -1;
      if (keysRef.current.right) steer = 1;
    }

    // 2. Physics Step
    car.update(dt, throttle, steer, config);
    track.checkConeCollision(car.x, car.y, 26);
    track.checkWallCollision(car);

    // 3. Skid Marks & Smoke Particles
    const wheels = car.getWheelPositions();
    for (let i = 0; i < wheels.length; i++) {
      const w = wheels[i];
      // Rear wheels leave more skids during drift or hard braking
      const shouldSkid = config.showTireTracks && (car.isDrifting || (throttle < 0 && car.speed > 80));
      particles.recordTireMark(i, w.x, w.y, shouldSkid, car.speed);

      if (car.isDrifting && car.speed > 90) {
        particles.addSmoke(w.x, w.y, car.vx, car.vy, 1);
      }
    }
    particles.update(dt);

    // 4. Camera Step
    camera.update(car.x, car.y, car.angle, car.vx, car.vy, dt);

    // 5. Telemetry updates
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFpsUpdateRef.current >= 200) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current));
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;

      updateTelemetry({
        speed: Math.round(car.speed),
        speedKmh: Math.round(car.speed * 0.36),
        slipAngle: Math.round((car.slipAngle * 180) / Math.PI),
        lateralG: Number((Math.abs(car.lateralVelocity * car.angularVelocity) / 980).toFixed(2)),
        throttle: Number(throttle.toFixed(2)),
        steering: Number(steer.toFixed(2)),
        isDrifting: car.isDrifting,
        fps
      });
    }

    // 6. Canvas Render
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewW = canvas.width / dpr;
    const viewH = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, viewW, viewH);

    // Camera Transform into World Space
    camera.applyTransform(ctx);

    // Draw Track & Cones
    track.render(ctx, camera.x, camera.y, viewW, viewH);

    // Draw Skid Marks & Smoke Particles
    particles.render(ctx);

    // Draw Rear-Touch Push Gizmo in World Space
    if (config.showTouchGizmo && controller.gizmo.isActive) {
      drawRearTouchGizmo(ctx, controller.gizmo, config);
    }

    // Draw Car Chassis
    drawCar(ctx, car, config, throttle);

    // Draw Debug Vectors (if enabled)
    if (config.showDebugVectors) {
      drawDebugVectors(ctx, car);
    }

    ctx.restore();
  });

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'none',
        display: 'block',
        cursor: 'crosshair'
      }}
    />
  );
};

/**
 * Renders the Rear-Touch Push interactive circle and tether gizmo
 */
function drawRearTouchGizmo(
  ctx: CanvasRenderingContext2D,
  gizmo: RearTouchController['gizmo'],
  config: ReturnType<typeof useCarConfigStore.getState>
) {
  ctx.save();

  // 1. Rear Bumper Anchor Point
  ctx.fillStyle = '#00f2fe';
  ctx.beginPath();
  ctx.arc(gizmo.anchorWorldX, gizmo.anchorWorldY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Push-zone boundary circle centered at the anchor
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(gizmo.anchorWorldX, gizmo.anchorWorldY, config.rearPushRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Deadzone circle
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(gizmo.anchorWorldX, gizmo.anchorWorldY, config.rearDeadzone, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Elastic Tether Line from Rear Anchor to Finger
  const isAccelerating = gizmo.throttle > 0;
  const isBraking = gizmo.throttle < 0;
  const tetherColor = isBraking ? '#ff3366' : isAccelerating ? '#00f2fe' : '#94a3b8';

  ctx.strokeStyle = tetherColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(gizmo.anchorWorldX, gizmo.anchorWorldY);
  ctx.lineTo(gizmo.touchWorldX, gizmo.touchWorldY);
  ctx.stroke();

  // 3. Finger Touch Point Indicator Ring
  ctx.fillStyle = isBraking ? 'rgba(255, 51, 102, 0.3)' : 'rgba(0, 242, 254, 0.3)';
  ctx.beginPath();
  ctx.arc(gizmo.touchWorldX, gizmo.touchWorldY, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = tetherColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(gizmo.touchWorldX, gizmo.touchWorldY, 22, 0, Math.PI * 2);
  ctx.stroke();

  // Center touch dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(gizmo.touchWorldX, gizmo.touchWorldY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Renders stylized vehicle chassis with wheels, windows, headlights & brake glow
 */
function drawCar(
  ctx: CanvasRenderingContext2D,
  car: CarPhysics,
  config: ReturnType<typeof useCarConfigStore.getState>,
  throttle: number
) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  const length = car.length;
  const width = car.width;
  const halfL = length / 2;
  const halfW = width / 2;

  // 1. Soft Dynamic Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(-halfL + 4, -halfW + 5, length, width, 8);
  ctx.fill();

  // 2. Wheels
  ctx.fillStyle = '#1e293b';
  const wheelL = 16;
  const wheelW = 7;
  const wheelXFront = car.wheelBase / 2;
  const wheelXRear = -car.wheelBase / 2;
  const wheelYOffset = car.trackWidth / 2;

  // Front Left Wheel (Steered)
  ctx.save();
  ctx.translate(wheelXFront, -wheelYOffset);
  ctx.rotate(car.frontWheelSteerAngle);
  ctx.fillRect(-wheelL / 2, -wheelW / 2, wheelL, wheelW);
  ctx.restore();

  // Front Right Wheel (Steered)
  ctx.save();
  ctx.translate(wheelXFront, wheelYOffset);
  ctx.rotate(car.frontWheelSteerAngle);
  ctx.fillRect(-wheelL / 2, -wheelW / 2, wheelL, wheelW);
  ctx.restore();

  // Rear Left Wheel
  ctx.fillRect(wheelXRear - wheelL / 2, -wheelYOffset - wheelW / 2, wheelL, wheelW);
  // Rear Right Wheel
  ctx.fillRect(wheelXRear - wheelL / 2, wheelYOffset - wheelW / 2, wheelL, wheelW);

  // 3. Car Main Body Shell
  ctx.fillStyle = config.carColor;
  ctx.beginPath();
  ctx.roundRect(-halfL, -halfW, length, width, 10);
  ctx.fill();

  // Dark roof/cockpit
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(-halfL + 12, -halfW + 4, length - 26, width - 8, 6);
  ctx.fill();

  // Windshield (Front)
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.roundRect(halfL - 26, -halfW + 5, 8, width - 10, 3);
  ctx.fill();

  // Rear Window
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(-halfL + 14, -halfW + 5, 6, width - 10, 2);
  ctx.fill();

  // Headlights
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(halfL - 4, -halfW + 2, 4, 6);
  ctx.fillRect(halfL - 4, halfW - 8, 4, 6);

  // Brake / Taillights
  const isBraking = throttle < 0 || (car.speed > 30 && throttle === 0);
  ctx.fillStyle = isBraking ? '#ff0033' : '#7f1d1d';
  ctx.fillRect(-halfL, -halfW + 3, 3, 6);
  ctx.fillRect(-halfL, halfW - 9, 3, 6);

  // Taillight glow on braking
  if (isBraking) {
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 12;
    ctx.fillRect(-halfL - 2, -halfW + 3, 2, 6);
    ctx.fillRect(-halfL - 2, halfW - 9, 2, 6);
    ctx.shadowBlur = 0;
  }

  // Front Headlight Beam (Atmospheric light cone)
  ctx.save();
  const grad = ctx.createRadialGradient(halfL + 10, 0, 5, halfL + 90, 0, 100);
  grad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
  grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(halfL, -halfW + 2);
  ctx.lineTo(halfL + 130, -halfW - 35);
  ctx.lineTo(halfL + 130, halfW + 35);
  ctx.lineTo(halfL, halfW - 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Draws real-time physics vectors (velocity, heading, lateral slip)
 */
function drawDebugVectors(ctx: CanvasRenderingContext2D, car: CarPhysics) {
  ctx.save();
  // 1. Heading Vector (Cyan)
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(car.x, car.y);
  ctx.lineTo(car.x + Math.cos(car.angle) * 50, car.y + Math.sin(car.angle) * 50);
  ctx.stroke();

  // 2. Velocity Vector (Green / Yellow)
  if (car.speed > 5) {
    ctx.strokeStyle = car.isDrifting ? '#ff7e40' : '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(car.x, car.y);
    ctx.lineTo(car.x + car.vx * 0.25, car.y + car.vy * 0.25);
    ctx.stroke();
  }

  ctx.restore();
}
