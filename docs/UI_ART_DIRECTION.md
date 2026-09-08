# UI Art Direction & Modular Theming Guide 🎨

> **Document Status**: Complete & Active  
> **Target Audience**: UI/UX Designers, Game Developers, Theme Authors, and AI Coding Agents modifying or reskinning the Top-Down 2D Car Engine.

---

## 1. Executive Summary & Art Direction

The **Top-Down 2D Car Engine** features a **Fresh Pop & Bright Minimalist** visual aesthetic (Option A). This art direction moves away from generic, brooding cyber-grids in favor of a playful, tactile, and modern arcade aesthetic reminiscent of premium contemporary mobile titles (*Clash Mini*, *Brawl Stars*, *Alto's Odyssey*).

### Core Visual Pillars
1. **Chunky Tactile Physicality**: Buttons feel like physical plastic or silicone toy buttons that depress when pushed. They feature prominent 3D bottom bevels and instant physical depression on touch/click.
2. **Harmonious Two-Font Pairing**: 
   - **`Lilita One`**: Punchy, bold, rounded display font for all interactive buttons, primary titles, drift badges, and speed digits.
   - **`Be Vietnam Pro`**: Contemporary, geometric sans-serif (weights 400–800) with friendly curves for body text, car descriptions, telemetry labels, and drawer controls.
3. **Approachable, Vibrant Color Palette**: High-contrast, saturated candy/pop colors (Electric Coral, Sky Azure, Sunshine Amber, Fresh Mint) on clean frosted acrylic/glass cards.
4. **Single-File Re-Skinning**: 100% of the UI design tokens (fonts, colors, bevel depths, radii) are centralized in [`src/styles/theme.css`](../src/styles/theme.css) so developers can re-theme the entire game in seconds without editing JSX.

---

## 2. Typography Hierarchy

| Role | Font Family | Weights | Intended Usage |
| :--- | :--- | :--- | :--- |
| **Action & Buttons** | **`Lilita One`** | 400 (Heavy) | Chunky buttons (`SELECT & DRIVE`, `CHOOSE CAR`, `TUNING`), modal headers, speed digits, drift pills. |
| **Body & UI Text** | **`Be Vietnam Pro`** | 400, 500, 600, 700 | Vehicle archetype, narrative descriptions, telemetry stat labels (`SLIP`, `G`, `FPS`), sliders, touch hints. |
| **Telemetry Values** | **`JetBrains Mono`** / **`Be Vietnam Pro`** | 700 (Bold) | Raw numerical units and degrees. |

Google Fonts are loaded in [`index.html`](../index.html) and assigned to semantic CSS variables in [`src/styles/theme.css`](../src/styles/theme.css):

```css
:root {
  --theme-font-action: 'Lilita One', cursive, sans-serif;
  --theme-font-body: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --theme-font-mono: 'JetBrains Mono', monospace;
}
```

---

## 3. Chunky Button Anatomy & Physics

Chunky buttons simulate a mechanical push-switch using pure CSS geometry:

```
          ┌──────────────────────────────────────────────┐
          │                                              │  ▲
          │           SELECT & DRIVE 🏁                  │  │ Button Surface
          │                                              │  ▼
          ├──────────────────────────────────────────────┤  ▲
          │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  │ 3D Bottom Bevel (--theme-btn-bevel: 4px)
          └──────────────────────────────────────────────┘  ▼
```

### Physical State Transitions
1. **Rest State (`translateY(0)`)**:
   - The button surface rests at $Y=0$.
   - A solid drop shadow simulates the bottom edge:
     ```css
     box-shadow: 0 var(--theme-btn-bevel) 0 var(--btn-shadow);
     ```
2. **Hover State**:
   - `filter: brightness(1.08);` gives visual feedback on desktop.
3. **Active / Pressed State (`:active`)**:
   - The button moves downward by `--theme-btn-press` (default: `3px`):
     ```css
     transform: translateY(var(--theme-btn-press));
     box-shadow: 0 var(--theme-btn-pressed-bevel) 0 var(--btn-shadow);
     ```
   - This produces an instantaneous, satisfying tactile "click" on both touchscreens and mice.

---

## 4. Re-Skinning in 60 Seconds (`src/styles/theme.css`)

Every visual token is isolated in [`src/styles/theme.css`](../src/styles/theme.css). Anyone integrating this engine can customize its appearance instantly:

### Recipe A: Flat Modern Minimalist (No 3D Bevel)
```css
:root {
  --theme-btn-bevel: 0px;       /* Removes the 3D bevel */
  --theme-btn-press: 0px;       /* Disables downward translation */
  --theme-btn-radius: 8px;      /* Subtle modern rounded corners */
}
```

### Recipe B: Retro Pixel Arcade
```css
:root {
  --theme-font-action: 'Press Start 2P', monospace;
  --theme-font-body: 'Press Start 2P', monospace;
  --theme-btn-radius: 0px;      /* Sharp pixel edges */
  --theme-btn-bevel: 4px;       /* 8-bit chunky bevel */
}
```

### Recipe C: Custom Brand Colors
```css
:root {
  --color-coral: #e11d48;
  --color-coral-shadow: #9f1239;
  --color-sky: #6366f1;
  --color-sky-shadow: #4338ca;
}
```

---

## 5. Modular UI Components Architecture

The UI layer is partitioned cleanly to prevent styling leakage:

```text
src/
├── styles/
│   ├── theme.css            # 🎨 Visual tokens (Fonts, Colors, Radii, Bevels)
│   ├── ui-components.css    # 🧱 Reusable classes (.btn-chunky, .ui-card, .ui-modal-sheet)
│   └── global.css           # 🌐 Viewport resets and container layout
│
├── components/debug/
│   ├── TelemetryHUD.tsx     # Speedometer card, Choose Car button, Reset & Tuning
│   └── DebugMenu.tsx        # In-game physics sliders & control switches
│
└── demo/components/
    ├── CarSelectModal.tsx   # Vehicle showroom dialog with 3-stat ratings
    └── CarPreview.tsx       # Real-time top-down vector vehicle preview
```

### Available CSS Classes ([`src/styles/ui-components.css`](../src/styles/ui-components.css))
- **Buttons**:
  - `.btn-chunky`: Base 3D tactile button.
  - `.btn-chunky-coral`, `.btn-chunky-sky`, `.btn-chunky-amber`, `.btn-chunky-mint`: Color themes.
  - `.btn-chunky-ghost`: Translucent glassmorphic button.
  - `.btn-chunky-light`: Clean white button with soft gray bevel and dark icon/text.
  - `.btn-chunky-icon`: Square 42×42px icon button.
  - `.btn-chunky-circle`: Circular 38×38px carousel navigation button.
  - `.btn-chunky-lg`: Large hero action button (e.g. Drive).
  - `.btn-chunky-md`: Standard chunky action button (e.g. Choose Car).
  - `.btn-chunky-sm`: Compact pill button.
- **Surfaces**:
  - `.ui-card`: Frosted glass panel with ambient blur.
  - `.ui-modal-sheet`: High-contrast frosted white acrylic modal sheet with crisp border.
  - `.ui-drawer-sheet`: Frosted white acrylic slide-out tuning drawer.
  - `.ui-card-inset`: Clean inset tablet for stats, car showcase podium, and control groups.
  - `.ui-speedo-card`: Standout light-mode floating telemetry card.
  - `.ui-guidance-pill`: Bottom interaction hint pill.

---

## 6. How to Decouple or Replace the UI Entirely

Because the core simulation engine ([`src/engine/`](../src/engine/)) is 100% headless and decoupled from React, consumers can replace the default UI completely:

1. **Keep Engine, Drop UI**: In [`src/App.tsx`](../src/App.tsx), remove `<TelemetryHUD />`, `<DebugMenu />`, or `<CarSelectModal />`.
2. **Mount Custom HUD**: Connect your custom HUD components directly to Zustand stores:
   - Vehicle speed & telemetry: `useGameStore((s) => s.telemetry)`
   - Vehicle configuration & color: `useCarConfigStore()`
3. **Headless Engine**: You can unmount React entirely and consume [`src/engine/CarPhysics.ts`](../src/engine/CarPhysics.ts) directly inside PixiJS, Three.js, Phaser, or a Node.js server. See [`docs/INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md).

---

## 7. Cross-Document References

- 📐 **[System Architecture (`docs/ARCHITECTURE.md`)](./ARCHITECTURE.md)**: Game loop, viewport scaling (`BoundingBox`), and multi-layer rendering.
- 🏎️ **[Vehicle Physics Model (`docs/VEHICLE_PHYSICS.md`)](./VEHICLE_PHYSICS.md)**: Mathematical derivation of drift physics and vehicle stats.
- 🕹️ **[Rear-Touch Controls (`docs/CONTROLS_REAR_TOUCH.md`)](./CONTROLS_REAR_TOUCH.md)**: Single-finger push steering and pivot torque.
- 🔌 **[Plug-and-Play Integration Guide (`docs/INTEGRATION_GUIDE.md`)](./INTEGRATION_GUIDE.md)**: Decoupling the engine and headless usage.
- 🤖 **[AI Coding Agent Cheatsheet (`docs/AGENTS.md`)](./AGENTS.md)**: Invariants, coordinates, and prompt templates.
- 📖 **[Master System Design Document (`docs/DESIGN_DOC.md`)](./DESIGN_DOC.md)**: High-level overview and documentation directory.
