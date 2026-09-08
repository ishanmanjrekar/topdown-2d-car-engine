# Plug-and-Play Integration & Decoupling Guide 🔌

> **File Path**: `docs/INTEGRATION_GUIDE.md`  
> **Audience**: Game developers integrating this driving engine into existing projects or building full commercial games.

---

## 1. Quick Integration into an Existing Project

### Step 1: Copy Core Engine Files
Copy the following self-contained engine folder into your project:
```bash
src/engine/
├── CarPhysics.ts            # Vehicle dynamics simulation (Zero dependencies)
├── RearTouchController.ts   # Touch-behind single-finger control math
├── Camera.ts                # Lookahead chase camera
├── ParticleSystem.ts        # Tire skid marks & smoke
└── Track.ts                 # Arena boundary & obstacles
```

### Step 2: Minimal Game Loop (Vanilla JS / Canvas)
You don't even need React to run the engine. Here is a bare-bones implementation:

```ts
import { CarPhysics } from './engine/CarPhysics';
import { Camera } from './engine/Camera';

const car = new CarPhysics(0, 0, -Math.PI / 2);
const camera = new Camera(0, 0);

const defaultConfig = {
  maxSpeed: 500,
  acceleration: 520,
  reverseSpeed: 180,
  braking: 650,
  naturalDrag: 0.982,
  steerRate: 4.0,
  driftFactor: 0.92,
  angularDrag: 0.88,
  carColor: '#00f2fe'
};

let lastTime = performance.now();

function loop(currentTime: number) {
  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  // 1. Update vehicle (throttle [-1..1], steer [-1..1])
  car.update(dt, throttleInput, steerInput, defaultConfig);

  // 2. Update chase camera
  camera.update(car.x, car.y, car.speed, car.angle, dt);

  // 3. Render
  ctx.save();
  camera.applyTransform(ctx);
  // draw your car / track here
  ctx.restore();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

---

## 2. How to Detach the Demo Showroom Layer

The demo car presets, 3-stat rating showroom, and preview graphics are strictly isolated in `src/demo/`.

To strip this engine down to pure driving without the showroom demo:

1. **Remove the UI component from [`src/App.tsx`](../src/App.tsx)**:
   ```diff
   - import { CarSelectModal } from './demo/components/CarSelectModal';
   ...
   - <CarSelectModal />
   ```

2. **Remove the "Choose Car" button from [`src/components/debug/TelemetryHUD.tsx`](../src/components/debug/TelemetryHUD.tsx)**:
   Delete the `<button onClick={() => setCarSelectOpen(true)} ...>Choose Car</button>`.

3. **Delete the folder**:
   ```bash
   rm -rf src/demo/
   ```

The core simulation, camera, touch controls, and telemetry HUD will continue functioning 100% identically!

---

## 3. Custom Vehicle Graphics & Sprites

By default, the engine draws a sleek procedural vector sports car with glowing headlights and dynamic brake lights in `drawCar()` ([`src/components/game/CarCanvas.tsx`](../src/components/game/CarCanvas.tsx)).

### Using Custom PNG / WebP Sprites:

1. Load your vehicle image asset:
   ```ts
   const carSprite = new Image();
   carSprite.src = '/assets/cars/supercar_topdown.png';
   ```

2. Replace the body rendering inside `drawCar()`:
   ```ts
   function drawCar(ctx: CanvasRenderingContext2D, car: CarPhysics, config: any) {
     ctx.save();
     ctx.translate(car.x, car.y);
     ctx.rotate(car.angle);

     const width = car.width;   // e.g. 32px
     const length = car.length; // e.g. 64px

     // Draw custom sprite centered
     ctx.drawImage(carSprite, -length / 2, -width / 2, length, width);

     ctx.restore();
   }
   ```

---

## 4. Designing Custom Tracks & Surface Grip

### Custom Track Layouts:
Edit [`src/engine/Track.ts`](../src/engine/Track.ts):
- Change `this.bounds = { minX: -2000, maxX: 2000, minY: -2000, maxY: 2000 }` to set custom world borders.
- Populate `this.innerCones` and `this.outerCones` with custom waypoint coordinates to trace race circuits, hairpins, and chicanes.

### Surface Friction (Asphalt vs. Mud vs. Ice):
You can dynamically modify `config.driftFactor` and `config.naturalDrag` based on the car's current world coordinates:
- **Asphalt**: `driftFactor: 0.90` (crisp cornering)
- **Mud / Gravel**: `driftFactor: 0.96`, `naturalDrag: 0.94` (loose slide, heavy resistance)
- **Ice / Oil Slick**: `driftFactor: 0.985`, `naturalDrag: 0.995` (near frictionless slip)

---

---

## 5. UI Customization & Re-Theming

The presentation layer is designed to be effortlessly customized or replaced:
- **60-Second Re-Skinning**: Customize all fonts, colors, border radii, and 3D button bevels by editing [`src/styles/theme.css`](../src/styles/theme.css). See **[UI Art Direction & Theming Guide (`docs/UI_ART_DIRECTION.md`)](./UI_ART_DIRECTION.md)**.
- **Custom UI / Headless HUD**: Remove or replace `<TelemetryHUD />`, `<DebugMenu />`, and `<CarSelectModal />` in [`src/App.tsx`](../src/App.tsx) and bind your custom React/HTML components to `useGameStore` and `useCarConfigStore`.

---

## 6. Headless Multiplayer Server Support

Because `CarPhysics.ts` has zero DOM or canvas dependencies:
- Run authoritative vehicle physics on a Node.js / Bun / WebSocket game server at 60Hz.
- Receive input packets `{ throttle, steer }` from clients.
- Run `car.update(dt, throttle, steer, config)`.
- Broadcast compressed telemetry packets `{ x, y, angle, vx, vy }` back to connected clients.
