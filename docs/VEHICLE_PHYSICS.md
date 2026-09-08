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

## World Bounds & Collision Dynamics (`Track.ts`)

### 1. Perimeter Arena Boundaries
The playable arena is bounded by $X \in [-1300, 1300]\text{ px}$ and $Y \in [-1300, 1300]\text{ px}$ (a $2600 \times 2600\text{ px}$ tarmac arena).

When the vehicle collides with a boundary wall (accounting for a $32\text{ px}$ car half-extent margin):
- Position is clamped to the boundary margin.
- Perpendicular velocity is reflected with an elastic restitution coefficient:
  $$v_{\perp} \leftarrow -v_{\perp} \cdot 0.35$$
- Parallel velocity is attenuated by wall surface friction:
  $$v_{\parallel} \leftarrow v_{\parallel} \cdot 0.75$$
- Angular velocity is dampened to prevent erratic spinning along barriers:
  $$\omega \leftarrow \omega \cdot 0.40$$

### 2. Track Cones & Obstacles
- Slalom courses and skid pad rings feature traffic cones ($r_{\text{cone}} = 10\text{ px}$).
- Circle-circle collision detection against vehicle collision radius ($r_{\text{car}} = 26\text{ px}$):
  $$\text{dist} = \sqrt{(x - x_{\text{cone}})^2 + (y - y_{\text{cone}})^2} < (26 + 10)\text{ px}$$
- When hit, `cone.hit` is flagged `true`, rendering the cone as knocked over and displaced.

---

## Telemetry HUD Formulas

Published at $5\text{ Hz}$ ($200\text{ ms}$ interval) from `CarCanvas.tsx` to `useGameStore`:

| Metric | Formula / Source | Display Unit |
|--------|------------------|--------------|
| **Speed** | $\|\vec{v}\| = \sqrt{v_x^2 + v_y^2}$ | $\text{px/s}$ |
| **Speed (km/h)** | $\text{round}(\text{speed} \times 0.36)$ | $\text{km/h}$ |
| **Slip Angle** | $\text{round}\left(\text{slipAngle} \times \frac{180}{\pi}\right)$ | Degrees ($^\circ$) |
| **Lateral G-Force** | $\frac{|v_{\text{lat}} \cdot \omega|}{980}$ (rounded to 2 decimals) | G |
| **Drift State** | $\text{slipAngle} > 16^\circ \land \text{speed} > 80\text{ px/s}$ | Boolean badge |
| **FPS** | $(\text{frames} \times 1000) / \Delta t_{\text{ms}}$ | Frames/sec |

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

### Built-in Vehicle Presets:

| Parameter | Arcade Default | Street Drift | Track Grip | Heavy Muscle |
|-----------|----------------|--------------|------------|--------------|
| **`maxSpeed`** | $460\text{ px/s}$ | $520\text{ px/s}$ | $500\text{ px/s}$ | $440\text{ px/s}$ |
| **`acceleration`** | $480\text{ px/s}^2$ | $520\text{ px/s}^2$ | $550\text{ px/s}^2$ | $600\text{ px/s}^2$ |
| **`reverseSpeed`** | $180\text{ px/s}$ | $200\text{ px/s}$ | $160\text{ px/s}$ | $150\text{ px/s}$ |
| **`braking`** | $600\text{ px/s}^2$ | $500\text{ px/s}^2$ | $750\text{ px/s}^2$ | $450\text{ px/s}^2$ |
| **`naturalDrag`** | $0.982$ | $0.988$ | $0.978$ | $0.985$ |
| **`steerRate`** | $3.8\text{ rad/s}$ | $4.2\text{ rad/s}$ | $4.5\text{ rad/s}$ | $3.2\text{ rad/s}$ |
| **`driftFactor`** | $0.930$ | $0.965$ | $0.860$ | $0.950$ |
| **`angularDrag`** | $0.880$ | $0.910$ | $0.820$ | $0.890$ |
| **`rearAnchorDistance`** | $55\text{ px}$ | $60\text{ px}$ | $50\text{ px}$ | $65\text{ px}$ |
| **`rearPushRadius`** | $110\text{ px}$ | $120\text{ px}$ | $100\text{ px}$ | $130\text{ px}$ |
| **`rearSteerMaxOffset`** | $85\text{ px}$ | $90\text{ px}$ | $75\text{ px}$ | $95\text{ px}$ |
| **`rearDeadzone`** | $10\text{ px}$ | $8\text{ px}$ | $10\text{ px}$ | $12\text{ px}$ |
| **`carColor`** | `#00f2fe` (Cyan) | `#ff7e40` (Orange) | `#39ff14` (Neon Green) | `#ff3366` (Crimson) |
