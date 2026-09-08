# Top-Down 2D Car Engine 🏎️

> High-performance 2D arcade car driving engine featuring "Smash Cops" rear-touch push steering, realistic lateral drift physics, live telemetry HUD, in-game tuning drawer, and cross-platform compilation (Web, Itch.io sandbox, and Android APK).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7-119EFF.svg)](https://capacitorjs.com/)

---

## 📚 Technical Documentation

Detailed mathematical formulations, architecture diagrams, and tuning dictionaries are documented in the [`docs/`](./docs) folder:

- **[System Architecture (`docs/ARCHITECTURE.md`)](./docs/ARCHITECTURE.md)**: Full game loop pipeline, dynamic follow camera with lookahead and car-up rotation, responsive viewport scaling (`BoundingBox`), multi-layer canvas rendering, and state management.
- **[Smash Cops Push Steering (`docs/CONTROLS_REAR_TOUCH.md`)](./docs/CONTROLS_REAR_TOUCH.md)**: Mathematical derivation of rear bumper anchor projection, push throttle dynamics, counter-rotational steer torque, touch unprojection through camera transforms, and interactive visual gizmo.
- **[2D Vehicle Physics Model (`docs/VEHICLE_PHYSICS.md`)](./docs/VEHICLE_PHYSICS.md)**: Velocity decomposition into local coordinates, powertrain drive & active braking, lateral drift friction decay, speed-dependent steering authority, arena wall collisions, telemetry equations, and preset specifications.

---

## ✨ Features

- 🎮 **Intuitive Rear-Touch Steering**: Pilot the car with a single finger placed behind the rear bumper — push forward to throttle, slide laterally to steer, press ahead to brake/reverse.
- 💨 **Arcade Drift Physics**: Dynamic tire friction model with realistic oversteer, slip angle measurement, continuous tire skid marks, and expanding tire smoke particles.
- 🎥 **Dynamic Chase Camera**: Speed-proportional forward lookahead, smooth damping, and automatic rotation to keep the vehicle oriented upwards with $40\%$ bottom screen room for finger controls.
- 📊 **Real-Time Telemetry HUD**: Live digital speedometer ($\text{km/h}$ and $\text{px/s}$), slip angle indicator, estimated lateral G-force meter, drift state indicator, and FPS counter.
- 🎛️ **Live Tuning Drawer**: In-game slide-out drawer to tweak physics constants in real time or switch between built-in presets (`Smash Cops`, `Street Drift`, `Track Grip`, `Heavy Muscle`).
- 📱 **Cross-Platform Deployment**:
  - **Web / Itch.io Sandbox**: Letterboxed responsive scaler clamped to physical screen bounds.
  - **Native Android APK**: 100% fluid borderless fullscreen layout powered by Capacitor 7.

---

## 🏎️ Vehicle Tuning Presets

The engine comes equipped with 4 ready-to-race tuning setups:

| Preset | Max Speed | Acceleration | Lateral Friction | Drift Threshold | Style / Feel |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Smash Cops** (Default) | 880 px/s | 1150 px/s² | 0.88 | 16° | High-torque arcade pursuit with forgiving slide recovery |
| **Street Drift** | 920 px/s | 1300 px/s² | 0.78 | 12° | Loose rear end tuned for sustained high-angle drifts |
| **Track Grip** | 1000 px/s | 1450 px/s² | 0.96 | 24° | High downforce, sticky tires, sharp cornering lines |
| **Heavy Muscle** | 820 px/s | 950 px/s² | 0.84 | 14° | Weighty momentum, deep engine rumble, wide swing turns |

---

## 📁 Project Structure

```text
topdown-2d-car-engine/
├── docs/                      # Architectural & mathematical documentation
│   ├── ARCHITECTURE.md
│   ├── CONTROLS_REAR_TOUCH.md
│   └── VEHICLE_PHYSICS.md
├── scripts/                   # Automated build & packaging scripts
│   ├── build-apk.ps1          # Compiles signed/debug Android APK
│   ├── build-itch.ps1         # Compiles zip bundle for itch.io web sandbox
│   └── setup-mobile-env.ps1   # Bootstraps local portable JDK & Android SDK
├── src/                       # Game engine source code
│   ├── components/            # React UI overlay components (HUD, TuningDrawer, BoundingBox)
│   ├── engine/                # Core physics, camera, particle system, and canvas renderer
│   ├── store/                 # Zustand state stores (physics parameters, telemetry)
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

### Keyboard Dev Controls
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

## 📄 License

This project is licensed under the [MIT License](LICENSE) &copy; 2026 Ishan Manjrekar.
