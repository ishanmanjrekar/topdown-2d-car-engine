# AI Coding Agent Context & Invariants Cheatsheet 🤖

> **File Path**: `docs/AGENTS.md`  
> **Purpose**: Provides AI coding assistants (Antigravity, Cursor, GitHub Copilot, Claude Code, ChatGPT) with exact rules, architectural invariants, and code contracts to build games safely on top of this engine.

---

## 1. Directory & File Map

```text
src/
├── engine/                      # PURE SIMULATION CORE (Headless, 0 UI / React dependencies)
│   ├── CarPhysics.ts            # Vehicle dynamics, longitudinal drive, braking, lateral drift
│   ├── RearTouchController.ts   # Touch-behind anchor projection, push throttle & steering
│   ├── Camera.ts                # Lookahead chase camera with car-up rotation & damping
│   ├── ParticleSystem.ts        # Wheel skid marks and expanding tire smoke
│   └── Track.ts                 # Arena boundary, wall bounce, slalom cones
│
├── stores/                      # STATE MANAGEMENT (Zustand)
│   ├── useGameStore.ts          # Telemetry stream, HUD visibility flags, UI modals
│   └── useCarConfigStore.ts     # Live physics parameters, cosmetics, hot reload
│
├── components/                  # VIEWPORT & UI
│   ├── game/CarCanvas.tsx       # Canvas 2D render pipeline & pointer event listener
│   ├── debug/TelemetryHUD.tsx   # Speedometer, G-force, drift alert, Choose Car button
│   ├── debug/DebugMenu.tsx      # Physics slider drawer
│   └── common/BoundingBox.tsx   # Letterboxed responsive aspect ratio wrapper
│
└── demo/                        # DETACHABLE DEMO LAYER (Zero core dependencies)
    ├── carPresets.ts            # 5 Car presets (Apex GT, Track Phantom, Tokyo Drifter, etc.)
    └── components/
        ├── CarPreview.tsx       # Standalone canvas top-down vector vehicle preview
        └── CarSelectModal.tsx   # Showroom dialog with 3-stat ratings and DRIVE button
```

---

## 2. Inviolable Code Invariants (Must Follow)

When generating or refactoring code in this repository, you **MUST** uphold these rules:

### 1. Pure Headless Engine Isolation
- Files inside `src/engine/` must **NEVER** import React, JSX, DOM globals (`document`, `window`), or Zustand stores.
- Pass configuration objects (`CarPhysicsConfig`) explicitly into `CarPhysics.update(dt, throttle, steer, config)`.

### 2. Coordinate System Conventions
- Canvas 2D Cartesian plane: $+X$ points **Right**, $+Y$ points **Down**.
- Heading angle $\theta$: $\theta_0 = -\pi/2$ points **North / Up**.
- Forward unit vector: $\vec{u}_{\text{fwd}} = (\cos\theta, \sin\theta)$.
- Right (lateral) unit vector: $\vec{u}_{\text{right}} = (-\sin\theta, \cos\theta)$.
- **Always normalize angles** to $[-\pi, \pi]$ after integration:
  ```ts
  this.angle = Math.atan2(Math.sin(this.angle), Math.cos(this.angle));
  ```

### 3. Low-Speed Steering Authority
- Do **NOT** allow instantaneous full-rate turning when the car is stopped. Steering torque must scale with speed:
  ```ts
  const speedRatio = Math.min(Math.abs(this.longitudinalVelocity) / 60, 1.0);
  const targetAngularVelocity = steer * config.steerRate * speedRatio * reverseMultiplier;
  ```

### 4. Frame-Rate Independent Drag & Drift
- Never multiply drag or drift factor directly by raw `dt`. Always normalize exponential decays to 60 FPS:
  ```ts
  this.longitudinalVelocity *= Math.pow(config.naturalDrag, dt * 60);
  this.lateralVelocity *= Math.pow(config.driftFactor, dt * 60);
  ```

### 5. Decoupled Demo Layer
- Any new showcase cars, cosmetic menus, or demo gameplay modes should be added inside `src/demo/`.
- Do **not** hardcode demo-specific presets inside `CarPhysics.ts`.

---

## 3. Ready-to-Use AI Agent Prompt Templates

### Template A: Adding AI Enemy / Pursuit Cars
```text
I want to add AI-controlled enemy cars to my top-down driving game using this repo:
https://github.com/ishanmanjrekar/topdown-2d-car-engine

Please instantiate an array of CarPhysics instances in a new manager 'src/engine/AIPursuitManager.ts':
1. Steer towards the player's world position (car.x, car.y).
2. Calculate target steering angle using Math.atan2(dy, dx) - aiCar.angle.
3. Apply obstacle avoidance against Track cones and boundary walls.
4. Render the AI cars in CarCanvas.tsx with distinct enemy colors.
```

### Template B: Adding Checkpoint Lap Timer & Race Track
```text
I want to build a lap-based circuit race on top of topdown-2d-car-engine.
Please:
1. Define a list of sequential checkpoint line segments in a new file 'src/engine/RaceTrack.ts'.
2. Implement line-intersection or radius trigger detection in the game loop.
3. Track current lap, best lap time, and split times in a new Zustand store 'useRaceStore.ts'.
4. Display a sleek HUD banner showing current lap time and checkpoint splits.
```

### Template C: Replacing Canvas Car with Custom 2D Sprites
```text
I want to replace the procedural canvas vehicle with my own PNG car sprite.
Please refer to 'docs/INTEGRATION_GUIDE.md' and:
1. Load my car texture asset using standard Image() loading.
2. Update drawCar() in 'src/components/game/CarCanvas.tsx' to use ctx.drawImage() centered on (-length/2, -width/2).
3. Ensure front wheels still render or rotate appropriately if the sprite does not include baked-in wheels.
```
