import { CarPhysicsConfig, useCarConfigStore } from '../stores/useCarConfigStore';

export type SpoilerType = 'none' | 'ducktail' | 'gt-wing' | 'dual-fin';

export interface CarVisualConfig {
  primaryColor: string;
  accentColor: string;
  spoilerType: SpoilerType;
  stripe: boolean;
  underglowColor: string;
}

export interface CarStatsRating {
  speed: number;        // Rated 1 to 5
  acceleration: number; // Rated 1 to 5
  handling: number;     // Rated 1 to 5 (governs cornering grip & braking deceleration)
}

export interface CarPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  archetype: string;
  ratings: CarStatsRating;
  visuals: CarVisualConfig;
  physics: Partial<CarPhysicsConfig>;
}

export const CAR_PRESETS: CarPreset[] = [
  {
    id: 'apex-gt',
    name: 'Apex GT',
    badge: 'STARTER ALL-ROUNDER',
    archetype: 'Balanced Cruiser',
    description: 'Forgiving chassis dynamics, balanced power delivery, and predictable braking.',
    ratings: {
      speed: 3,
      acceleration: 3,
      handling: 3
    },
    visuals: {
      primaryColor: '#00f2fe',
      accentColor: '#ffffff',
      spoilerType: 'ducktail',
      stripe: false,
      underglowColor: 'rgba(0, 242, 254, 0.5)'
    },
    physics: {
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
      carColor: '#00f2fe',
      accentColor: '#ffffff',
      spoilerType: 'ducktail',
      stripe: false,
      underglowColor: 'rgba(0, 242, 254, 0.5)'
    }
  },
  {
    id: 'track-phantom',
    name: 'Track Phantom',
    badge: 'GRIP SPECIALIST',
    archetype: 'Aero Track Car',
    description: 'High mechanical grip and racing calipers. Decelerates instantly and corners on rails.',
    ratings: {
      speed: 4,
      acceleration: 4,
      handling: 5
    },
    visuals: {
      primaryColor: '#39ff14',
      accentColor: '#0f172a',
      spoilerType: 'gt-wing',
      stripe: true,
      underglowColor: 'rgba(57, 255, 20, 0.5)'
    },
    physics: {
      maxSpeed: 500,
      acceleration: 540,
      reverseSpeed: 180,
      braking: 820,
      naturalDrag: 0.978,
      steerRate: 4.4,
      driftFactor: 0.86,
      angularDrag: 0.82,
      rearAnchorDistance: 50,
      rearPushRadius: 105,
      rearSteerMaxOffset: 75,
      rearDeadzone: 8,
      invertSteer: false,
      carColor: '#39ff14',
      accentColor: '#0f172a',
      spoilerType: 'gt-wing',
      stripe: true,
      underglowColor: 'rgba(57, 255, 20, 0.5)'
    }
  },
  {
    id: 'tokyo-drifter',
    name: 'Tokyo Drifter',
    badge: 'DRIFT MACHINE',
    archetype: 'Street Drift Tuner',
    description: 'Low-grip rear tires built for effortless slip initiation, long powerslides, and loose braking.',
    ratings: {
      speed: 4,
      acceleration: 4,
      handling: 2
    },
    visuals: {
      primaryColor: '#ff7e40',
      accentColor: '#18181b',
      spoilerType: 'dual-fin',
      stripe: true,
      underglowColor: 'rgba(255, 126, 64, 0.5)'
    },
    physics: {
      maxSpeed: 510,
      acceleration: 520,
      reverseSpeed: 200,
      braking: 480,
      naturalDrag: 0.988,
      steerRate: 4.2,
      driftFactor: 0.965,
      angularDrag: 0.91,
      rearAnchorDistance: 60,
      rearPushRadius: 120,
      rearSteerMaxOffset: 90,
      rearDeadzone: 8,
      invertSteer: false,
      carColor: '#ff7e40',
      accentColor: '#18181b',
      spoilerType: 'dual-fin',
      stripe: true,
      underglowColor: 'rgba(255, 126, 64, 0.5)'
    }
  },
  {
    id: 'iron-v8',
    name: 'Iron V8 Muscle',
    badge: 'TORQUE MONSTER',
    archetype: 'Heavy American Muscle',
    description: 'Explosive straight-line launch torque. Demands respect into corners with longer braking distance.',
    ratings: {
      speed: 3,
      acceleration: 5,
      handling: 1
    },
    visuals: {
      primaryColor: '#ff2a55',
      accentColor: '#f8fafc',
      spoilerType: 'none',
      stripe: true,
      underglowColor: 'rgba(255, 42, 85, 0.5)'
    },
    physics: {
      maxSpeed: 450,
      acceleration: 640,
      reverseSpeed: 160,
      braking: 420,
      naturalDrag: 0.984,
      steerRate: 3.1,
      driftFactor: 0.952,
      angularDrag: 0.89,
      rearAnchorDistance: 65,
      rearPushRadius: 130,
      rearSteerMaxOffset: 95,
      rearDeadzone: 12,
      invertSteer: false,
      carColor: '#ff2a55',
      accentColor: '#f8fafc',
      spoilerType: 'none',
      stripe: true,
      underglowColor: 'rgba(255, 42, 85, 0.5)'
    }
  },
  {
    id: 'hyperion-xlr',
    name: 'Hyperion XLR',
    badge: 'HYPERCAR PROTOTYPE',
    archetype: 'Exotic Speed Demon',
    description: 'Blistering top speed and active aero downforce. Carbon-ceramic brakes keep extreme velocity in check.',
    ratings: {
      speed: 5,
      acceleration: 4,
      handling: 4
    },
    visuals: {
      primaryColor: '#a855f7',
      accentColor: '#38bdf8',
      spoilerType: 'gt-wing',
      stripe: true,
      underglowColor: 'rgba(168, 85, 247, 0.55)'
    },
    physics: {
      maxSpeed: 580,
      acceleration: 560,
      reverseSpeed: 210,
      braking: 720,
      naturalDrag: 0.984,
      steerRate: 4.1,
      driftFactor: 0.89,
      angularDrag: 0.85,
      rearAnchorDistance: 55,
      rearPushRadius: 115,
      rearSteerMaxOffset: 80,
      rearDeadzone: 9,
      invertSteer: false,
      carColor: '#a855f7',
      accentColor: '#38bdf8',
      spoilerType: 'gt-wing',
      stripe: true,
      underglowColor: 'rgba(168, 85, 247, 0.55)'
    }
  }
];

/**
 * Clean helper to apply a chosen car preset to the config store
 * without touching or resetting the car's dynamic world position.
 */
export function applyCarPreset(presetId: string): boolean {
  const preset = CAR_PRESETS.find((p) => p.id === presetId);
  if (!preset) return false;

  useCarConfigStore.getState().updateConfig({
    ...preset.physics,
    presetId: preset.id
  });

  return true;
}
