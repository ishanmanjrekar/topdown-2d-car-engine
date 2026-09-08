import { create } from 'zustand';

export interface CarPhysicsConfig {
  // Powertrain & Dynamics
  maxSpeed: number;           // Max forward speed in px/s
  acceleration: number;       // Acceleration rate in px/s²
  reverseSpeed: number;       // Max reverse speed in px/s
  braking: number;            // Braking deceleration in px/s²
  naturalDrag: number;        // Coasting speed decay [0.95 - 0.99]

  // Handling & Drift
  steerRate: number;          // Steering turning speed in rad/s
  driftFactor: number;        // Grip slip multiplier [0.88 = high grip, 0.96 = slippery drift]
  angularDrag: number;        // Angular velocity decay [0.80 - 0.95]

  // Rear-Touch Push Steering ("Touch-Behind")
  rearAnchorDistance: number; // Distance in pixels behind car for rear bumper anchor
  rearPushRadius: number;     // Distance required behind anchor for 100% throttle
  rearSteerMaxOffset: number; // Lateral offset in pixels for 100% steering lock
  rearDeadzone: number;       // Deadband in pixels to prevent wobble
  invertSteer: boolean;       // Invert lateral push direction

  // Visuals & Debugging
  showDebugVectors: boolean;  // Draw velocity, forward heading & push vectors
  showTireTracks: boolean;    // Draw skid marks on track
  showTouchGizmo: boolean;    // Draw rear touch circle and tether line
  carColor: string;           // Vehicle chassis accent color
}

export type PresetName = 'arcade-default' | 'street-drift' | 'track-grip' | 'heavy-muscle';

interface CarConfigState extends CarPhysicsConfig {
  updateConfig: (patch: Partial<CarPhysicsConfig>) => void;
  resetToDefault: () => void;
  loadPreset: (preset: PresetName) => void;
}

const PRESETS: Record<PresetName, CarPhysicsConfig> = {
  'arcade-default': {
    maxSpeed: 460,
    acceleration: 480,
    reverseSpeed: 180,
    braking: 600,
    naturalDrag: 0.982,
    steerRate: 3.8,
    driftFactor: 0.93,
    angularDrag: 0.88,
    rearAnchorDistance: 55,
    rearPushRadius: 110,
    rearSteerMaxOffset: 85,
    rearDeadzone: 10,
    invertSteer: false,
    showDebugVectors: true,
    showTireTracks: true,
    showTouchGizmo: true,
    carColor: '#00f2fe'
  },
  'street-drift': {
    maxSpeed: 520,
    acceleration: 520,
    reverseSpeed: 200,
    braking: 500,
    naturalDrag: 0.988,
    steerRate: 4.2,
    driftFactor: 0.965,
    angularDrag: 0.91,
    rearAnchorDistance: 60,
    rearPushRadius: 120,
    rearSteerMaxOffset: 90,
    rearDeadzone: 8,
    invertSteer: false,
    showDebugVectors: true,
    showTireTracks: true,
    showTouchGizmo: true,
    carColor: '#ff7e40'
  },
  'track-grip': {
    maxSpeed: 500,
    acceleration: 550,
    reverseSpeed: 160,
    braking: 750,
    naturalDrag: 0.978,
    steerRate: 4.5,
    driftFactor: 0.86,
    angularDrag: 0.82,
    rearAnchorDistance: 50,
    rearPushRadius: 100,
    rearSteerMaxOffset: 75,
    rearDeadzone: 10,
    invertSteer: false,
    showDebugVectors: true,
    showTireTracks: true,
    showTouchGizmo: true,
    carColor: '#39ff14'
  },
  'heavy-muscle': {
    maxSpeed: 440,
    acceleration: 600,
    reverseSpeed: 150,
    braking: 450,
    naturalDrag: 0.985,
    steerRate: 3.2,
    driftFactor: 0.95,
    angularDrag: 0.89,
    rearAnchorDistance: 65,
    rearPushRadius: 130,
    rearSteerMaxOffset: 95,
    rearDeadzone: 12,
    invertSteer: false,
    showDebugVectors: true,
    showTireTracks: true,
    showTouchGizmo: true,
    carColor: '#ff3366'
  }
};

export const useCarConfigStore = create<CarConfigState>((set) => ({
  ...PRESETS['arcade-default'],

  updateConfig: (patch) => set((state) => ({ ...state, ...patch })),
  resetToDefault: () => set({ ...PRESETS['arcade-default'] }),
  loadPreset: (preset) => set({ ...PRESETS[preset] })
}));
