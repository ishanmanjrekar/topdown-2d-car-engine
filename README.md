# Top-Down 2D Car Engine 🏎️

> High-performance 2D arcade car driving physics engine featuring intuitive rear-touch push steering (touch-behind throttle & pivot steering), lateral drift physics, real-time telemetry HUD, in-game tuning drawer, and cross-platform compilation (Web, Itch.io sandbox, and Android APK).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7-119EFF.svg)](https://capacitorjs.com/)

---

## 📚 Technical Documentation & System Design

Detailed mathematical formulations, architecture diagrams, and tuning dictionaries are documented in the [`docs/`](./docs) folder:

- **[System Design Document (`docs/DESIGN_DOC.md`)](./docs/DESIGN_DOC.md)**: Overarching architecture roadmap, component contracts, lifecycle, and documentation directory.
- **[System Architecture (`docs/ARCHITECTURE.md`)](./docs/ARCHITECTURE.md)**: Full game loop pipeline, dynamic follow camera with lookahead and car-up rotation, responsive viewport scaling (`BoundingBox`), multi-layer canvas rendering, and state management.
- **[2D Vehicle Physics Model (`docs/VEHICLE_PHYSICS.md`)](./docs/VEHICLE_PHYSICS.md)**: Velocity decomposition into local coordinates, powertrain drive & active braking, lateral drift friction decay, speed-dependent steering authority, arena wall collisions, telemetry equations, and preset specifications.
- **[Rear-Touch Push Steering (`docs/CONTROLS_REAR_TOUCH.md`)](./docs/CONTROLS_REAR_TOUCH.md)**: Mathematical derivation of rear bumper anchor projection, push throttle dynamics, counter-rotational steer torque, touch unprojection through camera transforms, and interactive visual gizmo.
- **[UI Art Direction & Theming (`docs/UI_ART_DIRECTION.md`)](./docs/UI_ART_DIRECTION.md)**: Fresh Pop & Bright Minimalist art direction, Lilita One chunky buttons, Be Vietnam Pro typography, 3D tactile button physics, and 60-second single-file re-skinning.
- **[Plug-and-Play Integration Guide (`docs/INTEGRATION_GUIDE.md`)](./docs/INTEGRATION_GUIDE.md)**: How to extract the core engine, strip the demo showroom layer, replace procedural cars with custom sprites, and run headlessly on multiplayer servers.
- **[AI Coding Agent Invariants (`docs/AGENTS.md`)](./docs/AGENTS.md)**: Context card, coordinate system invariants, and copy-paste prompt templates for LLM pair-programmers (Antigravity, Cursor, Copilot, Claude Code).

---

## ✨ Features

- 🎮 **Intuitive Rear-Touch Push Steering**: Pilot the car with a single finger placed behind the rear bumper — push forward to throttle, slide laterally to steer/swing the rear axle, and press forward ahead of the bumper to brake or reverse.
- 🏎️ **Vehicle Showroom & 5 Presets**: Choose between 5 distinct vehicles rated across **Speed**, **Acceleration**, and **Handling** (1–5 scale). Braking dynamics are tied directly to Handling. Switch cars on the fly without losing track position!
- 💨 **Arcade Drift Physics**: Dynamic tire friction model with realistic oversteer, slip angle measurement, continuous tire skid marks, and expanding tire smoke particles.
- 🎥 **Dynamic Chase Camera**: Speed-proportional forward lookahead, smooth damping, and automatic rotation to keep the vehicle oriented upwards with $40\%$ bottom screen room for touch controls.
- 📊 **Real-Time Telemetry HUD**: Live digital speedometer ($\text{km/h}$ and $\text{px/s}$), slip angle indicator, estimated lateral G-force meter, drift state indicator, FPS counter, and quick **Choose Car** access.
- 🔌 **Decoupled Plug-and-Play Architecture**: The core engine (`src/engine/`) is 100% headless with zero UI dependencies. The demo presets and showroom UI (`src/demo/`) are isolated and can be detached in 3 minutes.
- 📱 **Cross-Platform Deployment**:
  - **Web / Itch.io Sandbox**: Letterboxed responsive scaler clamped to physical screen bounds.
  - **Native Android APK**: 100% fluid borderless fullscreen layout powered by Capacitor 7.

---

## 🏎️ Vehicle Presets & Showroom (Rated 1 to 5)

Access the in-game showroom by tapping **`🏎️ Choose Car`** directly below the speedometer:

| Preset | Archetype | Color & Aero | Speed | Accel | Handling & Brakes | Style / Feel |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Apex GT** (Default) | Balanced Cruiser | Cyan `#00f2fe`, Ducktail | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Forgiving benchmark with predictable, stable braking. |
| **Track Phantom** | Grip Specialist | Lime `#39ff14`, GT Wing | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | High downforce; racing calipers stop on a dime. |
| **Tokyo Drifter** | Street Tuner | Orange `#ff7e40`, Dual Fins | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | Low tire grip; loose braking into sustained high-angle drifts. |
| **Iron V8 Muscle** | Heavy Muscle Dragster | Crimson `#ff2a55`, Stripe | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | Monstrous launch torque; weighty chassis with longer braking distance. |
| **Hyperion XLR** | Prototype Hypercar | Violet `#a855f7`, GT Wing | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Blistering top end speed; carbon-ceramic brakes for precision control. |

---

## 🤖 For AI Coding Assistants & Agentic Scaffolding

This repository is organized to be **zero-friction for AI coding agents** (Antigravity, Cursor, Claude Code, GitHub Copilot, ChatGPT). If you want an AI assistant to build a full game using this driving engine, simply share the repo link and use the prompt template below.

### Engine Quick-Reference for AI Agents
The core physics, camera, and input math are completely decoupled and modular:
- **`src/engine/CarPhysics.ts`**: Pure TypeScript 2D vehicle dynamics. Computes longitudinal acceleration, tire slip angle, lateral drift friction decay, and arena bounds collisions. It has zero UI dependencies and can run in React, Canvas 2D, WebGL, PixiJS, Three.js, or headless on Node.js servers.
- **`src/engine/RearTouchController.ts`**: Single-finger rear-anchor steering controller. Computes forward push-throttle, counter-rotational steer torque, and braking/reverse vectors in car-local space.
- **`src/engine/Camera.ts`**: Smooth chase camera with forward lookahead proportional to velocity and car-up heading rotation.
- **`src/engine/Track.ts`**: Arena boundaries, walls, slalom cones, skidpads, and trackside obstacles.
- **`src/stores/useCarConfigStore.ts`**: Live physics tuning state with hot-reloading presets.

### 📋 Ready-to-Use AI Agent Prompt Template
Copy and paste this prompt to an AI assistant:

```text
I am building a 2D top-down driving game. Please use this repository as my base vehicle physics and control engine:
https://github.com/ishanmanjrekar/topdown-2d-car-engine

Please preserve the core driving foundation:
1. Vehicle physics simulation (src/engine/CarPhysics.ts)
2. Rear-touch push-behind steering system (src/engine/RearTouchController.ts)
3. Dynamic chase camera (src/engine/Camera.ts)
4. Vehicle configuration store (src/stores/useCarConfigStore.ts)

On top of this engine, help me build:
- [Insert your desired game features here: e.g., AI enemy pursuit cars, checkpoint-based lap timer, cargo delivery objectives, procedural track generation, or custom vehicle skins].
```

---

## 🧩 How to Reuse & Extend This Engine

### 1. Designing Custom Tracks or Arenas
Open [`src/engine/Track.ts`](./src/engine/Track.ts):
- Modify `this.bounds` to change the arena dimensions.
- Edit `this.innerCones` and `this.outerCones` to lay out custom track circuits or obstacle courses.
- Add collision geometry inside `checkWallCollision()` or register custom obstacle bounding boxes.

### 2. Adding Game Rules & Objectives (Laps, Pursuit, Delivery)
The vehicle coordinates (`car.x`, `car.y`, `car.speed`, `car.angle`) are available on every frame in `CarCanvas.tsx` or via `useGameStore.ts`. You can easily add:
- **Checkpoints / Lap Timers**: Define line segments or radius triggers in world coordinates and test `hypot(car.x - cp.x, car.y - cp.y) < threshold`.
- **AI Opponents / Police Pursuit**: Instantiate multiple `CarPhysics` instances and steer them toward the player's position using simple pursuit steering vectors.
- **Collectibles & Targets**: Render pickup nodes on the canvas and check bounding circle intersections.

### 3. Custom Vehicle Graphics
By default, `CarCanvas.tsx` renders a sleek procedural vector sports car with headlights, brake lights, and wheels. To use a custom sprite or 2D spritesheet:
- Replace `drawCar()` in `CarCanvas.tsx` with `ctx.drawImage(myCarSprite, -width/2, -height/2, width, height)`.

---

## 📁 Project Structure

```text
topdown-2d-car-engine/
├── docs/                      # Architectural & mathematical documentation
│   ├── ARCHITECTURE.md        # Pipeline, viewport scaling & state management
│   ├── CONTROLS_REAR_TOUCH.md # Rear-touch steering math & touch unprojection
│   └── VEHICLE_PHYSICS.md     # Lateral drift friction decay & presets
├── scripts/                   # Automated build & packaging scripts
│   ├── build-apk.ps1          # Compiles signed/debug Android APK
│   ├── build-itch.ps1         # Compiles zip bundle for itch.io web sandbox
│   └── setup-mobile-env.ps1   # Bootstraps local portable JDK & Android SDK
├── src/                       # Game engine source code
│   ├── components/            # React UI overlay components (HUD, TuningDrawer, BoundingBox)
│   ├── engine/                # Core physics, camera, particle system, and canvas renderer
│   ├── stores/                # Zustand state stores (physics parameters, telemetry)
│   ├── App.tsx                # Main canvas mount & orchestration
│   └── main.tsx               # Application entry point
├── capacitor.config.ts        # Capacitor mobile native shell configuration
├── index.html                 # Web app entry point with responsive viewport settings
├── package.json               # Node dependencies and project scripts
├── tsconfig.json              # TypeScript root project configuration
└── vite.config.ts             # Vite bundler build configuration
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation & Local Development
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### Keyboard Controls (Desktop Testing)
When testing on desktop without touch, keyboard overrides are enabled:
- `W` / `↑`: Full Throttle
- `S` / `↓`: Brake / Reverse
- `A` / `←`: Steer Left
- `D` / `→`: Steer Right
- `R`: Instant Vehicle & Track Reset

---

## 🛠️ Build & Export Commands

- **Web Build**:
  ```bash
  npm run build
  ```
- **Itch.io Package**:
  ```bash
  npm run build:itch
  ```
  Creates a self-contained, POSIX-compatible zip file in `dump/` with cross-origin isolation headers.
- **Sync Capacitor Mobile Project**:
  ```bash
  npm run build:mobile
  ```
- **Automated Portable Android SDK & APK Build**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/setup-mobile-env.ps1
  powershell -ExecutionPolicy Bypass -File scripts/build-apk.ps1
  ```

---

## 💡 Inspiration & Attribution

The intuitive single-touch push-behind steering mechanic is inspired by mobile arcade classics such as Hutch Games' *Smash Cops*.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) &copy; 2026 Ishan Manjrekar.
