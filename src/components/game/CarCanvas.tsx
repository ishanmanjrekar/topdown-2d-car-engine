import React, { useRef, useEffect, useCallback } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { CarPhysics } from '../../engine/CarPhysics';
import { RearTouchController } from '../../engine/RearTouchController';
import { ParticleSystem } from '../../engine/ParticleSystem';
import { Camera } from '../../engine/Camera';
import { ITrack } from '../../engine/ITrack';
import { DemoTrack } from '../../demo/track/DemoTrack';
import { useCarConfigStore } from '../../stores/useCarConfigStore';
import { useGameStore } from '../../stores/useGameStore';
import { drawCar } from '../../engine/renderers/CarRenderer';
import { drawRearTouchGizmo } from '../../engine/renderers/GizmoRenderer';
import { drawDebugVectors } from '../../engine/renderers/DebugRenderer';

export interface CarCanvasProps {
  track?: ITrack;
}

export const CarCanvas: React.FC<CarCanvasProps> = ({ track: externalTrack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Engine singletons stored in refs to avoid recreation
  const carRef = useRef<CarPhysics>(new CarPhysics(-32, 290, -Math.PI / 2));
  const controllerRef = useRef<RearTouchController>(new RearTouchController());
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());
  const cameraRef = useRef<Camera>(new Camera(-32, 290));
  const trackRef = useRef<ITrack>(externalTrack || new DemoTrack());

  // Ensure trackRef is properly updated if hot-reloaded or externalTrack changes
  useEffect(() => {
    trackRef.current = externalTrack || new DemoTrack();
  }, [externalTrack]);

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
  const fpsRef = useRef<number>(60);
  const lastTelemetryUpdateRef = useRef<number>(performance.now());

  // Store references
  const config = useCarConfigStore();
  const controlMode = useGameStore((s) => s.controlMode);
  const updateTelemetry = useGameStore((s) => s.updateTelemetry);
  const isPaused = useGameStore((s) => s.isPaused);

  // Reset Car trigger
  const handleResetCar = useCallback(() => {
    carRef.current.reset(-32, 290, -Math.PI / 2);
    if (typeof cameraRef.current?.reset === 'function') {
      cameraRef.current.reset(-32, 290, -Math.PI / 2);
    } else {
      cameraRef.current.x = -32;
      cameraRef.current.y = 290;
      cameraRef.current.rotation = 0;
    }
    particlesRef.current.clear();
    if (typeof trackRef.current?.reset === 'function') {
      trackRef.current.reset();
    }
    pointerRef.current.active = false;
    pointerRef.current.pointerId = null;
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
      if (e.code === 'KeyC') useGameStore.getState().toggleCarSelect();
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

  // Pointer tracking for continuous touch-behind control
  const pointerRef = useRef<{
    active: boolean;
    pointerId: number | null;
    screenX: number;
    screenY: number;
  }>({
    active: false,
    pointerId: null,
    screenX: 0,
    screenY: 0
  });

  const updatePointerScreenCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const parent = canvas.parentElement;
    const logicalW = parent?.clientWidth || 480;
    const logicalH = parent?.clientHeight || 880;

    const scaleX = logicalW / rect.width;
    const scaleY = logicalH / rect.height;
    pointerRef.current.screenX = (clientX - rect.left) * scaleX;
    pointerRef.current.screenY = (clientY - rect.top) * scaleY;
  };

  // Pointer / Touch Handlers for Rear-Touch Control
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointerRef.current.active = true;
    pointerRef.current.pointerId = e.pointerId;
    updatePointerScreenCoords(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerRef.current.active && pointerRef.current.pointerId === e.pointerId) {
      updatePointerScreenCoords(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerRef.current.pointerId === e.pointerId) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      pointerRef.current.active = false;
      pointerRef.current.pointerId = null;
      controllerRef.current.setTouch(false);
    }
  };

  // Main Simulation & Render Loop
  useGameLoop((dtMs, shouldRender) => {
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
      if (pointerRef.current.active) {
        // Continuous per-frame unprojection guarantees steady throttle when thumb is held stationary
        const world = camera.screenToWorld(pointerRef.current.screenX, pointerRef.current.screenY);
        controller.setTouch(true, world.x, world.y);
      } else {
        controller.setTouch(false);
      }

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

    // 2. Surface Physics & Vehicle Dynamics
    const surface = track.getSurfaceAt ? track.getSurfaceAt(car.x, car.y) : { type: 'asphalt', gripMultiplier: 1.0, dragMultiplier: 1.0 };
    const effectiveConfig = surface.gripMultiplier < 1.0 || surface.dragMultiplier > 1.0 ? {
      ...config,
      driftFactor: Math.max(0.70, config.driftFactor * surface.gripMultiplier),
      naturalDrag: Math.pow(config.naturalDrag, surface.dragMultiplier)
    } : config;

    car.update(dt, throttle, steer, effectiveConfig);

    // Track dynamic props update & physical collisions
    if (typeof track.update === 'function') {
      track.update(dt, car);
    }
    if (typeof track.checkCollisions === 'function') {
      track.checkCollisions(car, dt);
    }

    // 3. Ground Displacement Speed Calculation (measured after wall & obstacle collisions)
    const actualDx = car.x - car.lastX;
    const actualDy = car.y - car.lastY;
    const instantDispSpeed = dt > 0 ? Math.hypot(actualDx, actualDy) / dt : 0;
    car.lastX = car.x;
    car.lastY = car.y;

    // Smooth displacement speed for responsive, realistic HUD readout
    car.displacementSpeed += (instantDispSpeed - car.displacementSpeed) * Math.min(1.0, 18 * dt);
    if (instantDispSpeed < 1.0 && Math.abs(throttle) < 0.05) {
      car.displacementSpeed = 0;
    }

    // Dynamic minimum speed for skids / smoke based on maxSpeed
    const minSkidSpeed = Math.min(45, config.maxSpeed * 0.18);

    // 4. Skid Marks & Smoke / Turf Particles
    const wheels = car.getWheelPositions();
    const isGrass = surface.type === 'grass';
    const smokeColor = isGrass ? 'rgba(34, 197, 94,' : 'rgba(210, 220, 235,';

    for (let i = 0; i < wheels.length; i++) {
      const w = wheels[i];
      // Rear wheels leave more skids during drift or hard braking
      const shouldSkid = config.showTireTracks && (car.isDrifting || (throttle < 0 && car.speed > minSkidSpeed));
      particles.recordTireMark(i, w.x, w.y, shouldSkid, car.speed);

      if (car.isDrifting && car.speed > minSkidSpeed * 1.1) {
        particles.addSmoke(w.x, w.y, car.vx, car.vy, 1, smokeColor);
      }
    }
    particles.update(dt);

    // 5. Camera Step
    camera.update(car.x, car.y, car.angle, car.vx, car.vy, dt);

    // 6. Telemetry & FPS updates
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFpsUpdateRef.current >= 400) {
      fpsRef.current = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current));
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }

    // Refresh telemetry at ~18Hz (~55ms) displaying real ground displacement speed
    if (now - lastTelemetryUpdateRef.current >= 55) {
      lastTelemetryUpdateRef.current = now;

      updateTelemetry({
        speed: Math.round(car.displacementSpeed),
        speedKmh: Math.round(car.displacementSpeed * 0.25),
        slipAngle: Math.round((car.slipAngle * 180) / Math.PI),
        lateralG: Number((Math.abs(car.lateralVelocity * car.angularVelocity) / 980).toFixed(2)),
        throttle: Number(throttle.toFixed(2)),
        steering: Number(steer.toFixed(2)),
        isDrifting: car.isDrifting,
        fps: fpsRef.current
      });
    }

    // 7. Canvas Render Pass (Only executed on final substep before screen presentation)
    if (!shouldRender) return;

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
