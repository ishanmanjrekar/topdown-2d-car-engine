# Top-Down 2D Car Engine — System Design Document 🏎️

> **Document Status**: Complete & Active  
> **Target Audience**: Game Developers, Systems Architects, and AI Coding Agents building top-down 2D driving games.

---

## 1. Executive Summary & Design Mission

The **Top-Down 2D Car Engine** is an arcade driving simulation engine engineered in TypeScript and React. Its mission is to deliver an ultra-responsive, arcade-grounded driving experience with **immediate plug-and-play reusability**.

Developers can drop this codebase into their own project, strip out the presentation demo in minutes, or use the modular physics core headlessly (in Node.js servers, WebGL/PixiJS renderers, or native mobile apps).

### Core Design Principles
1. **Zero Physics Dependencies**: The vehicle dynamics simulation ([`src/engine/CarPhysics.ts`](../src/engine/CarPhysics.ts)) is pure mathematical TypeScript. It does not import React, DOM APIs, Canvas, or third-party physics packages.
2. **Intuitive Single-Finger Steering**: Designed around **Rear-Touch Push Steering** ([`src/engine/RearTouchController.ts`](../src/engine/RearTouchController.ts)), allowing natural single-thumb driving on mobile screens without requiring an on-screen D-pad or virtual joystick.
3. **Decoupled Architecture**: Presentation features (such as the vehicle showroom and presets) are segregated in a self-contained demo layer ([`src/demo/`](../src/demo/)) so consumers can detach them without touching the simulation core.
4. **AI-First Documentation**: Every formula, coordinate frame, and architectural invariant is deeply documented so AI agents (Antigravity, Cursor, Copilot, Claude Code) can scaffold complete games on top of this foundation.

---

## 2. Documentation Sitemap & Deep Links

This repository maintains modular, comprehensive documentation across the [`docs/`](.) folder:

| Document | Description | Target Readers |
| :--- | :--- | :--- |
| 📐 **[System Architecture (`docs/ARCHITECTURE.md`)](./ARCHITECTURE.md)** | Game loop pipeline, canvas layering, camera projection matrix, BoundingBox responsive scaling, and state stores. | Game engine integrators & UI developers |
| 🏎️ **[Vehicle Physics Model (`docs/VEHICLE_PHYSICS.md`)](./VEHICLE_PHYSICS.md)** | Mathematical derivation of longitudinal drive, active braking, lateral drift decay, tire scrub, and 3-stat formula. | Physics engineers & gameplay tuners |
| 🕹️ **[Rear-Touch Controls (`docs/CONTROLS_REAR_TOUCH.md`)](./CONTROLS_REAR_TOUCH.md)** | Anchor point projection, touch delta unprojection, push throttle, pivot steering, and deadzone math. | Mobile UX & input designers |
| 🎨 **[UI Art Direction & Theming (`docs/UI_ART_DIRECTION.md`)](./UI_ART_DIRECTION.md)** | Fresh Pop & Bright Minimalist art direction, Lilita One chunky buttons, Be Vietnam Pro typography, 3D button physics, and 60-second single-file re-skinning. | UI/UX designers, theme authors & frontend devs |
| 🔌 **[Plug-and-Play Integration Guide (`docs/INTEGRATION_GUIDE.md`)](./INTEGRATION_GUIDE.md)** | Step-by-step guide to embed the engine, strip the demo layer, replace procedural cars with sprites, and build custom tracks. | Developers integrating the engine |
| 🤖 **[AI Coding Agent Cheatsheet (`docs/AGENTS.md`)](./AGENTS.md)** | AI context card with code invariants, file map, do's & don'ts, and ready-to-use prompt templates. | LLMs, Agentic pair programmers |

---

## 3. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION / PRESENTATION LAYER                      │
│                                                                                 │
│   ┌────────────────────────┐                   ┌────────────────────────────┐  │
│   │ TelemetryHUD           │                   │ CarSelectModal (Showroom)  │  │
│   │ Speedometer, G-Force,  │                   │ 5 Rated Presets, Preview   │  │
│   │ Drift Pill, Choose Car │                   │ (Atomic Zustand Selectors) │  │
│   └───────────┬────────────┘                   └─────────────┬──────────────┘  │
│               │                                              │                  │
│               ▼                                              ▼                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                           ZUSTAND STATE STORES                          │  │
│   │   useGameStore (telemetry, HUD flags)  │  useCarConfigStore (tuning)   │  │
│   └────────────────────────────────────────┬────────────────────────────────┘  │
│                                            │                                   │
│                                            ▼                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                     CarCanvas (Canvas 2D Viewport)                      │  │
│   │   - 120 Hz Fixed-Timestep Accumulator via useGameLoop (shouldRender)    │  │
│   │   - Continuous Screen-to-World Pointer Tracking (pointerId filtered)    │  │
│   │   - Modular Renderers: Track -> ParticleSystem -> CarRenderer           │  │
│   │     -> GizmoRenderer -> DebugRenderer                                   │  │
│   └────────────────────────────────────────┬────────────────────────────────┘  │
└────────────────────────────────────────────┼────────────────────────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CORE ENGINE SUBSYSTEMS (HEADLESS)                        │
│                                                                                 │
│   ┌───────────────────────┐  Input Vectors   ┌──────────────────────────────┐   │
│   │ RearTouchController   │ ───────────────> │ CarPhysics                   │   │
│   │ - Continuous anchor   │                  │ - 120 Hz Fixed Timestep      │   │
│   │ - In-place gizmo      │                  │ - Zero-allocation buffers    │   │
│   │   mutation            │                  │ - Longitudinal & Braking     │   │
│   └───────────────────────┘                  │ - Lateral drift friction     │   │
│                                              └──────────────┬───────────────┘   │
│                                                             │ Position (x,y)    │
│   ┌───────────────────────┐                  Lookahead Pos  │ Heading θ         │
│   │ Camera                │ <───────────────────────────────┘                   │
│   │ - Exponential damping │                                                     │
│   │ - Speed lookahead     │                  Wheel Coordinates (Float64Array)   │
│   │ - Car-up rotation     │ ─────────────────────────────────┐                  │
│   └───────────────────────┘                                  ▼                  │
│                                              ┌──────────────────────────────┐   │
│                                              │ ParticleSystem (Skid Marks)  │   │
│                                              │ - Batched 3-bucket alpha     │   │
│                                              │ - In-place array compaction  │   │
│                                              │ - Zero-allocation smoke      │   │
│                                              └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Subsystem Breakdown

### 4.1 Physics Core (`src/engine/CarPhysics.ts`)
- **State Representation**: World coordinates $(x, y)$, heading angle $\theta \in [-\pi, \pi]$, world velocity $(v_x, v_y)$, and angular velocity $\omega$.
- **Zero-Allocation Hot Loop**: Uses preallocated `wheelBuffer` (`Float64Array(8)`) and `rearBumperBuffer` to evaluate wheel hubs and bumper points without heap garbage collection during frames.
- **Coordinate Transformation**: Resolves velocity vectors into local forward $v_{\text{long}}$ and lateral $v_{\text{lat}}$ components.
- **Powertrain & Braking**: Forward drive accelerates up to `config.maxSpeed`. Negative throttle triggers active braking deceleration when forward velocity exceeds $10\text{ px/s}$.
- **Lateral Drift Model**: Per-frame exponential decay of $v_{\text{lat}}$ governed by `driftFactor`. High drift factor allows sustained powerslides; low drift factor mimics sticky racing slicks.
- **Tire Scrub**: Sideways slides and steered front wheels impose kinetic drag, naturally bleeding speed during hard donuts and drifts.
- **Wheel Geometry**: Evaluates all 4 wheel hubs $(x_{\text{hub}}, y_{\text{hub}})$ with front wheel steering angles for accurate skid mark placement.

### 4.2 Control Pipeline (`src/engine/RearTouchController.ts`)
- Projects an anchor point $55\text{ px}$ behind the car's rear bumper.
- **Continuous Tracking**: The canvas tracks `(screenX, screenY)` and re-projects to world coordinates every frame via `camera.screenToWorld()`, preventing stale coordinates when holding a finger stationary.
- Maps the touch offset vector $(\Delta_{\text{fwd}}, \Delta_{\text{side}})$ into:
  - **Push Throttle**: Forward push behind the car accelerates. Touching ahead of the anchor activates brakes or reverse.
  - **Counter-Steer Torque**: Sliding laterally steers the car in an intuitive push-behind motion.
  - **Deadzone & Normalization**: Built-in deadzone prevents steering wobble during straightaway acceleration.
- **In-Place Gizmo State**: Mutates a persistent `gizmo` object rather than creating new objects during active touch gestures.

### 4.3 Chase Camera (`src/engine/Camera.ts`)
- Follows the car with exponential damping.
- Projects a lookahead point forward along the velocity vector so the driver has sight distance ahead.
- Rotates the canvas view to keep the car facing upwards with $40\%$ screen margin at the bottom, providing ample thumb room for touch gestures.
- Provides `screenToWorld(sx, sy, out)` and `worldToScreen(wx, wy, out)` matrix transformations.

### 4.4 Modular Renderers (`src/engine/renderers/`)
- **CarRenderer (`CarRenderer.ts`)**: Procedural vector chassis with gradient liveries, aero wings, carbon splitters, glowing headlights, and braking taillights.
- **GizmoRenderer (`GizmoRenderer.ts`)**: Rear-touch push-behind UI gizmo with spring lines, anchor rings, steering arcs, and tactile touch feedback.
- **DebugRenderer (`DebugRenderer.ts`)**: Visualizes capsule collision spines, velocity vectors, lookahead targets, and wheel contact normals.

### 4.5 Demo Track & Collision (`src/demo/track/DemoTrack.ts`)
- **Capsule Collision**: Replaced single-point circular hitboxes with a swept two-circle capsule ($r=17\text{ px}$, spine length $36\text{ px}$) that accurately hugs vehicle chassis proportions and prevents corner clipping.
- **Radial Arc Surface Detection**: Exact analytical polar angle & distance checks for the North Sweeper and South Hairpin turns for tarmac vs. grass surface resistance.
- **Optimized Rendering**: Zero `shadowBlur` calls to prevent GPU compositor stalls on mobile and high-DPI displays.

### 4.6 Fixed Timestep Game Loop (`src/hooks/useGameLoop.ts`)
- Implements a fixed-timestep accumulator running physics at a deterministic $120\text{ Hz}$ ($dt = 1/120\text{ s}$).
- Prevents physics tunneling, stability breakdown on high-refresh displays ($120\text{ Hz}$, $144\text{ Hz}$, $240\text{ Hz}$), and sluggishness on $60\text{ Hz}$ screens.
- Emits a `shouldRender` boolean flag on the terminal sub-step, avoiding redundant canvas paint calls during multiple accumulator iterations.

### 4.7 Decoupled Demo Layer (`src/demo/`)
- Contains the 5 pre-tuned vehicle presets ([`src/demo/carPresets.ts`](../src/demo/carPresets.ts)):
  1. **Apex GT**: Balanced Starter (3/3/3)
  2. **Track Phantom**: Grip Specialist with GT wing (4/4/5)
  3. **Tokyo Drifter**: Street Drift Tuner with dual fins (4/4/2)
  4. **Iron V8 Muscle**: Heavy American Muscle (3/5/1)
  5. **Hyperion XLR**: Prototype Hypercar (5/4/4)
- **Showroom UI** ([`src/demo/components/CarSelectModal.tsx`](../src/demo/components/CarSelectModal.tsx)): Interactive modal featuring high-res top-down vector car previews, 3-stat ratings, atomic Zustand state subscriptions, and an instant, non-resetting **DRIVE** action.

---

## 5. Braking & Handling Dynamics Model

In traditional 3-stat racing setups (**Speed**, **Acceleration**, **Handling**), **Braking** is mathematically formulated as an integral part of the **Handling** stat:

$$\text{BrakingDecel} \propto \text{HandlingRating} \times \text{BaseBraking}$$
$$\text{LateralGrip} \propto \text{HandlingRating} \implies \text{driftFactor} = 0.99 - (0.026 \times \text{HandlingRating})$$

- **High Handling (e.g. Track Phantom, 5/5)**: Equips heavy-duty racing calipers ($820\text{ px/s}^2$ braking deceleration) and sticky compound tires (`driftFactor = 0.86`). It stops on a dime with zero brake slide.
- **Low Handling (e.g. Iron V8, 1/5; Tokyo Drifter, 2/5)**: Moderate braking deceleration ($420\text{--}480\text{ px/s}^2$) paired with lower lateral grip. Braking while cornering naturally induces oversteer slides (trail-braking into drifts).

---

## 6. How to Extend This Engine

For detailed instructions on extending or customizing the engine:
- To strip the demo and use in another project: See **[Integration Guide (`docs/INTEGRATION_GUIDE.md`)](./INTEGRATION_GUIDE.md)**.
- To create custom tracks or obstacle courses: See **[Demo Track Geometry (`src/demo/track/DemoTrack.ts`)](../src/demo/track/DemoTrack.ts)**.
- To customize vehicle graphics or modular renderers: See **[CarRenderer (`src/engine/renderers/CarRenderer.ts`)](../src/engine/renderers/CarRenderer.ts)** and **[Integration Guide - Section 3](./INTEGRATION_GUIDE.md#3-custom-vehicle-graphics--sprites)**.
- To run automated unit tests: Run `npm test` (`src/engine/__tests__/`).
- To give full repository context to an AI coding assistant: See **[AI Context Card (`docs/AGENTS.md`)](./AGENTS.md)**.

