# 2D Top-Down Vehicle Physics Model

## Overview & Design Goals
The physics engine implemented in `src/engine/CarPhysics.ts` delivers an arcade handling feel with grounded dynamics:
- **Instant Response**: Direct powertrain and braking forces without complex multi-gear transmission latency.
- **Controlled Drifting**: Tunable lateral friction decay allowing powerslides and corner drifts.
- **Low-Speed Stability**: Speed-ratio authority preventing unnatural stationary spinning.
- **True Velocity Decomposition**: Decoupled longitudinal and lateral velocity components integrated into world space.
- **Multi-Wheel Geometry**: Accurate wheel hub coordinates for tire skid marks and particle generation.

---

## Kinematics & Coordinate Representation

### 1. Orientation & Direction Vectors
- Global coordinates: Canvas 2D Cartesian plane where $+X$ is Right and $+Y$ is Down.
- Heading angle $\theta \in [-\pi, \pi]$ (initial heading $\theta_0 = -\pi/2$ points North / Up).
- Unit forward vector:
  $$\vec{u}_{\text{fwd}} = (\cos\theta, \sin\theta)$$
- Unit right (lateral) vector:
  $$\vec{u}_{\text{right}} = (-\sin\theta, \cos\theta)$$

### 2. Velocity Decomposition
At every physics step, global velocity $(v_x, v_y)$ is resolved into the vehicle's local reference frame:
$$v_{\text{long}} = \vec{v} \cdot \vec{u}_{\text{fwd}} = v_x \cos\theta + v_y \sin\theta$$
$$v_{\text{lat}} = \vec{v} \cdot \vec{u}_{\text{right}} = -v_x \sin\theta + v_y \cos\theta$$
$$\text{speed} = \|\vec{v}\| = \sqrt{v_x^2 + v_y^2}$$

---

## Dynamic Forces & Integration Equations

### 1. Longitudinal Drive & Braking
Drive forces act strictly along the vehicle's forward axis $\vec{u}_{\text{fwd}}$ based on the normalized throttle input $\tau \in [-1, 1]$:

```
                      ┌─── Accelerating: throttle > 0 and v_long < maxSpeed
                      │    a_long = throttle * acceleration
                      │
                      ├─── Active Braking: throttle < 0 and v_long > 10
Powertrain Force a ───┤    a_long = throttle * braking
                      │
                      └─── Reverse: throttle < 0 and v_long <= 10
                           a_long = throttle * (acceleration * 0.55)
```

1. **Forward Acceleration** ($\tau > 0$):
   If $v_{\text{long}} < \text{config.maxSpeed}$:
   $$a_{\text{long}} = \tau \cdot \text{config.acceleration}$$

2. **Active Braking** ($\tau < 0$ and $v_{\text{long}} > 10\text{ px/s}$):
   $$a_{\text{long}} = \tau \cdot \text{config.braking}$$

3. **Reverse Gear** ($\tau < 0$ and $v_{\text{long}} > -\text{config.reverseSpeed}$):
   $$a_{\text{long}} = \tau \cdot (\text{config.acceleration} \times 0.55)$$

4. **Longitudinal Integration & Rolling Drag**:
   $$v_{\text{long}}(t + \Delta t) = \left(v_{\text{long}}(t) + a_{\text{long}} \Delta t\right) \cdot \left(\text{config.naturalDrag}\right)^{\Delta t \cdot 60}$$
   The natural drag multiplier (default $0.982$) provides frame-rate independent rolling resistance normalized to 60 FPS.

---

### 2. Lateral Friction & Drift Model
Lateral velocity $v_{\text{lat}}$ represents unwanted sideways slippage (drift). In the real world, tire grip cancels this slip. The engine models this using a per-frame exponential decay governed by `driftFactor`:

$$v_{\text{lat}}(t + \Delta t) = v_{\text{lat}}(t) \cdot \left(\text{config.driftFactor}\right)^{\Delta t \cdot 60}$$

- **High Grip / Track Setup** ($\text{driftFactor} \approx 0.86$):
  Lateral velocity decays rapidly ($14\%$ decay per $1/60\text{s}$). The car grips aggressively through corners with minimal side-slip.
- **Balanced Arcade (Default)** ($\text{driftFactor} \approx 0.93$):
  Produces brief, controlled tire slides when cornering at high speeds before settling into grip.
- **Extended Drift / Powerslide** ($\text{driftFactor} \approx 0.965$):
  Lateral momentum is retained across frames ($3.5\%$ decay per $1/60\text{s}$), allowing sustained drifts, donuts, and pendulum turns.

#### Induced Cornering Drag & Tire Scrub:
Real-world tires generate kinetic friction opposing forward momentum when sliding or turned hard:
$$F_{\text{scrub}} = \text{steerScrub} + \text{driftScrub}$$
- **Steer Scrub**: Front-wheel angle drag $\approx 0.18 \cdot |\text{steer}|$.
- **Drift Scrub**: Sideways tire sliding friction $\approx 0.70 \cdot \min\left(1.0, \frac{|v_{\text{lat}}|}{0.35 \cdot \text{maxSpeed}}\right)$.
- When in a tight donut or full sideways drift, tire scrub decelerates forward speed until balancing engine throttle, naturally settling the car into a realistic drift crawl ($\approx 25\text{--}40\text{ px/s} = \mathbf{6\text{--}10\text{ km/h}}$). Straightening the steering drops scrub to zero, restoring full straightaway acceleration.

---

### 3. Steering Authority & Turning Rate
Steering changes front wheel orientation and exerts rotational torque:

1. **Visual Wheel Steer Angle**:
   $$\delta_{\text{steer}} = \text{steer} \cdot 0.55\text{ rad} \quad (\approx \pm 31.5^\circ)$$
2. **Speed-Scaled Authority**:
   To prevent unnatural spinning when stopped, steering torque scales linearly with forward speed up to $60\text{ px/s}$:
   $$\text{speedRatio} = \min\left(\frac{|v_{\text{long}}|}{60}, 1.0\right)$$
3. **Reverse Inversion**:
   When reversing ($v_{\text{long}} < -5\text{ px/s}$), steering reverses direction to match realistic vehicle behavior:
   $$\text{reverseMult} = \begin{cases} -1 & \text{if } v_{\text{long}} < -5 \\ +1 & \text{otherwise} \end{cases}$$
4. **Target Angular Velocity**:
   $$\omega_{\text{target}} = \text{steer} \cdot \text{config.steerRate} \cdot \text{speedRatio} \cdot \text{reverseMult}$$
5. **Rotational Smoothing & Angular Drag**:
   $$\omega \leftarrow \omega + (\omega_{\text{target}} - \omega) \cdot \min(1.0, 12 \cdot \Delta t)$$
   $$\omega \leftarrow \omega \cdot \left(\text{config.angularDrag}\right)^{\Delta t \cdot 60}$$

---

### 4. World Velocity Reconstruction & State Integration
Once local longitudinal and lateral velocities are updated, global velocities and positions are integrated:

$$v_x = v_{\text{long}} \cos\theta - v_{\text{lat}} \sin\theta$$
$$v_y = v_{\text{long}} \sin\theta + v_{\text{lat}} \cos\theta$$

$$x \leftarrow x + v_x \Delta t$$
$$y \leftarrow y + v_y \Delta t$$
$$\theta \leftarrow \theta + \omega \Delta t$$

Angle $\theta$ is normalized into $[-\pi, \pi]$:
$$\theta \leftarrow \text{atan2}(\sin\theta, \cos\theta)$$

---

### 5. Slip Angle & Drift Detection
The engine continuously evaluates tire grip breakdown for telemetry, HUD alerts, skid marks, and tire smoke:

1. When $\text{speed} > 25\text{ px/s}$, the velocity direction angle is:
   $$\theta_{\text{vel}} = \text{atan2}(v_y, v_x)$$
2. Slip angle is the angular deviation between chassis heading $\theta$ and motion direction $\theta_{\text{vel}}$ wrapped into $[0, \pi]$:
   $$\Delta\theta = |\theta - \theta_{\text{vel}}|$$
   $$\text{slipAngle} = \begin{cases} 2\pi - \Delta\theta & \text{if } \Delta\theta > \pi \\ \Delta\theta & \text{otherwise} \end{cases}$$
3. **Drift Flag** (`isDrifting`):
   $$\text{isDrifting} = (\text{slipAngle} > 0.28\text{ rad} \approx 16^\circ) \land (\text{speed} > 80\text{ px/s})$$

---

## Vehicle Dimensions & Wheel Kinematics

Vehicle dimensions in canvas pixels ($1\text{ m} \approx 20\text{ px}$):
- **Chassis Length**: $64\text{ px}$ ($3.2\text{ m}$)
- **Chassis Width**: $32\text{ px}$ ($1.6\text{ m}$)
- **Wheelbase ($L_{\text{wb}}$)**: $44\text{ px}$ ($2.2\text{ m}$)
- **Track Width ($W_{\text{tr}}$)**: $28\text{ px}$ ($1.4\text{ m}$)

World positions for all four wheel hubs are computed in `CarPhysics.getWheelPositions()`:
$$\vec{P}_{\text{wheel}} = \begin{pmatrix} x \\ y \end{pmatrix} + \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix} \begin{pmatrix} \pm L_{\text{wb}} / 2 \\ \pm W_{\text{tr}} / 2 \end{pmatrix}$$

| Wheel | Longitudinal Offset ($fwd$) | Lateral Offset ($side$) | Steered |
|-------|------------------------------|-------------------------|---------|
| **Front-Left** | $+22\text{ px}$ | $-14\text{ px}$ | Yes ($\delta_{\text{steer}}$) |
| **Front-Right** | $+22\text{ px}$ | $+14\text{ px}$ | Yes ($\delta_{\text{steer}}$) |
| **Rear-Left** | $-22\text{ px}$ | $-14\text{ px}$ | No (Fixed) |
| **Rear-Right** | $-22\text{ px}$ | $+14\text{ px}$ | No (Fixed) |

---

## World Bounds & Collision Dynamics (`Track.ts` & `DemoTrack.ts`)

### 1. Perimeter Arena Boundaries
- **Standalone Engine Track (`Track.ts`)**: Bounded by $X, Y \in [-1200, 1200]\text{ px}$ ($2400 \times 2400\text{ px}$).
- **Motorsport Proving Ground (`DemoTrack.ts`)**: Bounded by $X, Y \in [-1350, 1350]\text{ px}$ ($2700 \times 2700\text{ px}$).

When the vehicle collides with an outer perimeter barrier (accounting for a $34\text{ px}$ car half-extent margin):
- Position is clamped to the barrier margin along the normal.
- Perpendicular velocity is reflected with an elastic restitution coefficient:
  $$v_{\perp} \leftarrow -v_{\perp} \cdot 0.45$$
- Parallel velocity is attenuated by wall surface friction:
  $$v_{\parallel} \leftarrow v_{\parallel} \cdot 0.85$$
- Angular velocity is dampened to prevent erratic spinning along barriers:
  $$\omega \leftarrow \omega \cdot 0.40$$

### 2. Swept Axle Capsule Collision Geometry (Trees, Cones & Props)
In `DemoTrack.ts`, obstacles are tested against the vehicle's **two-circle swept spine capsule** rather than a single center circle:
- Spine segment spans from the rear axle $(x - 18\cos\theta, y - 18\sin\theta)$ to the front axle $(x + 18\cos\theta, y + 18\sin\theta)$, with a capsule radius of $r_{\text{capsule}} = 17\text{ px}$ ($34\text{ px}$ total width).
- For any circular obstacle at $(O_x, O_y)$ with radius $R_{\text{obs}}$, the collision test finds the closest point on the car's spine:
  $$\text{proj} = \max(0, \min(36, (O_x - \text{rear}_x)\cos\theta + (O_y - \text{rear}_y)\sin\theta))$$
  $$P_{\text{closest}} = \text{rear} + \text{proj} \cdot \vec{u}_{\text{fwd}}$$
  $$\text{dist} = \|O - P_{\text{closest}}\| < (17 + R_{\text{obs}})$$
- This ensures full geometric coverage: whether colliding nose-first, tail-first, or sliding broadside into trees or cones, the vehicle body never visually penetrates obstacle boundaries.

---

## Telemetry HUD Formulas

Published at $\sim 18\text{ Hz}$ ($55\text{ ms}$ interval) from `CarCanvas.tsx` to `useGameStore`:

| Metric | Formula / Source | Display Unit |
|--------|------------------|--------------|
| **Speed** | $v_{\text{disp}} = \frac{\sqrt{\Delta x^2 + \Delta y^2}}{\Delta t}$ (True Ground Displacement) | $\text{px/s}$ |
| **Speed (km/h)** | $\text{round}(v_{\text{disp}} \times 0.25)$ | $\text{km/h}$ |
| **Slip Angle** | $\text{round}\left(\text{slipAngle} \times \frac{180}{\pi}\right)$ | Degrees ($^\circ$) |
| **Lateral G-Force** | $\frac{|v_{\text{lat}} \cdot \omega|}{980}$ (rounded to 2 decimals) | G |
| **Drift State** | $\text{slipAngle} > 16^\circ \land v_{\text{disp}} > \min(45, \text{maxSpeed} \times 0.18)$ | Boolean badge |
| **FPS** | $(\text{frames} \times 1000) / \Delta t_{\text{ms}}$ (updated at $2.5\text{ Hz}$) | Frames/sec |

---

## Vehicle Tuning Constants & Presets

All variables are live-tunable via `useCarConfigStore` in the slide-out tuning drawer (`DebugMenu.tsx`).

### Parameter Dictionary:

| Parameter | Type | Unit | Range | Description |
|-----------|------|------|-------|-------------|
| `maxSpeed` | `number` | px/s | 200 – 800 | Top forward drive speed |
| `acceleration` | `number` | px/s² | 150 – 900 | Engine powertrain acceleration rate |
| `reverseSpeed` | `number` | px/s | 100 – 300 | Maximum reverse velocity |
| `braking` | `number` | px/s² | 200 – 1000 | Active deceleration force |
| `naturalDrag` | `number` | ratio | 0.95 – 0.995 | Rolling resistance speed decay per frame |
| `steerRate` | `number` | rad/s | 1.5 – 7.0 | Steering rotational turn rate |
| `driftFactor` | `number` | ratio | 0.82 – 0.98 | Lateral grip retention per frame |
| `angularDrag` | `number` | ratio | 0.75 – 0.95 | Rotational inertia decay per frame |

### Built-in Vehicle Presets (5 Archetypes):

| Parameter | Apex GT (Starter) | Track Phantom (Grip) | Tokyo Drifter (Drift) | Iron V8 (Muscle) | Hyperion XLR (Hypercar) |
|-----------|-------------------|----------------------|-----------------------|------------------|-------------------------|
| **`maxSpeed`** | $460\text{ px/s}$ | $500\text{ px/s}$ | $510\text{ px/s}$ | $450\text{ px/s}$ | $580\text{ px/s}$ |
| **`acceleration`** | $480\text{ px/s}^2$ | $540\text{ px/s}^2$ | $520\text{ px/s}^2$ | $640\text{ px/s}^2$ | $560\text{ px/s}^2$ |
| **`reverseSpeed`** | $180\text{ px/s}$ | $180\text{ px/s}$ | $200\text{ px/s}$ | $160\text{ px/s}$ | $210\text{ px/s}$ |
| **`braking`** | $600\text{ px/s}^2$ | $820\text{ px/s}^2$ | $480\text{ px/s}^2$ | $420\text{ px/s}^2$ | $720\text{ px/s}^2$ |
| **`naturalDrag`** | $0.982$ | $0.978$ | $0.988$ | $0.984$ | $0.984$ |
| **`steerRate`** | $3.8\text{ rad/s}$ | $4.4\text{ rad/s}$ | $4.2\text{ rad/s}$ | $3.1\text{ rad/s}$ | $4.1\text{ rad/s}$ |
| **`driftFactor`** | $0.930$ | $0.860$ | $0.965$ | $0.952$ | $0.890$ |
| **`angularDrag`** | $0.880$ | $0.820$ | $0.910$ | $0.890$ | $0.850$ |
| **`carColor`** | `#00f2fe` (Cyan) | `#39ff14` (Lime) | `#ff7e40` (Orange) | `#ff2a55` (Crimson) | `#a855f7` (Violet) |
| **`spoilerType`** | Ducktail | GT Wing | Dual Fin | None | GT Wing |

---

## 3-Stat Arcade Ratings Model & Braking Dynamics

In the vehicle showroom ([`src/demo/components/CarSelectModal.tsx`](../src/demo/components/CarSelectModal.tsx)), cars are evaluated across three 5-star metrics: **Speed**, **Acceleration**, and **Handling**:

| Vehicle | Speed | Acceleration | Handling & Brakes | Archetype Description |
|---|:---:|:---:|:---:|---|
| **Apex GT** | ⭐⭐⭐ (3/5) | ⭐⭐⭐ (3/5) | ⭐⭐⭐ (3/5) | Balanced benchmark; smooth predictable braking. |
| **Track Phantom** | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐⭐⭐ (5/5) | Maximum downforce; racing calipers stop on a dime. |
| **Tokyo Drifter** | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐⭐ (4/5) | ⭐⭐ (2/5) | Low grip rear tires; loose braking into sustained slides. |
| **Iron V8 Muscle** | ⭐⭐⭐ (3/5) | ⭐⭐⭐⭐⭐ (5/5) | ⭐ (1/5) | Massive launch torque; heavy chassis with long braking distance. |
| **Hyperion XLR** | ⭐⭐⭐⭐⭐ (5/5) | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐⭐ (4/5) | Blistering velocity; carbon-ceramic brakes for high-speed control. |

### Why Braking is Coupled with Handling:
1. **Mechanical Reality**: Stopping distance is governed by tire friction limits ($\mu \cdot F_N$), not pad clamp force. A high-handling setup with high grip (`driftFactor = 0.86`) sustains high deceleration without locking up or losing lateral stability.
2. **Arcade Convention**: In 3-stat racing games (e.g., *Mario Kart*, *Asphalt*, *Need for Speed*), braking responsiveness and cornering grip are unified into **Handling**. Low-handling cars naturally suffer trail-braking oversteer, allowing players to initiate drifts by tapping reverse before corner turn-in.
