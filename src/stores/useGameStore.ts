import { create } from 'zustand';

export type ControlMode = 'rear-touch' | 'touch-joystick' | 'keyboard';

export interface TelemetryData {
  speed: number;        // Speed in px/s
  speedKmh: number;     // Simulated km/h (speed * 0.36)
  slipAngle: number;    // Difference between heading and velocity in degrees
  lateralG: number;     // Lateral G force estimate
  throttle: number;     // Current throttle input [0..1]
  steering: number;     // Current steering input [-1..1]
  isDrifting: boolean;  // True if tires are sliding
  fps: number;          // Measured frames per second
}

interface GameState {
  controlMode: ControlMode;
  debugMenuOpen: boolean;
  cameraZoom: number;
  isPaused: boolean;
  telemetry: TelemetryData;

  setControlMode: (mode: ControlMode) => void;
  toggleDebugMenu: () => void;
  setDebugMenuOpen: (open: boolean) => void;
  setCameraZoom: (zoom: number) => void;
  setIsPaused: (paused: boolean) => void;
  updateTelemetry: (telemetry: Partial<TelemetryData>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  controlMode: 'rear-touch',
  debugMenuOpen: false,
  cameraZoom: 1.0,
  isPaused: false,
  telemetry: {
    speed: 0,
    speedKmh: 0,
    slipAngle: 0,
    lateralG: 0,
    throttle: 0,
    steering: 0,
    isDrifting: false,
    fps: 60
  },

  setControlMode: (mode) => set({ controlMode: mode }),
  toggleDebugMenu: () => set((s) => ({ debugMenuOpen: !s.debugMenuOpen })),
  setDebugMenuOpen: (open) => set({ debugMenuOpen: open }),
  setCameraZoom: (zoom) => set({ cameraZoom: zoom }),
  setIsPaused: (paused) => set({ isPaused: paused }),
  updateTelemetry: (data) =>
    set((state) => ({ telemetry: { ...state.telemetry, ...data } }))
}));
