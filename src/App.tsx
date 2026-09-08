import React from 'react';
import { BoundingBox } from './components/common/BoundingBox';
import { CarCanvas } from './components/game/CarCanvas';
import { TelemetryHUD } from './components/debug/TelemetryHUD';
import { DebugMenu } from './components/debug/DebugMenu';
import { CarSelectModal } from './demo/components/CarSelectModal';

export const App: React.FC = () => {
  return (
    <BoundingBox width={480} height={880}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-dark)'
        }}
      >
        {/* Real-time 2D Vehicle Simulation & Track Canvas */}
        <CarCanvas />

        {/* Telemetry and Controls Overlay */}
        <TelemetryHUD />

        {/* Live Setup & Physics Debug Drawer */}
        <DebugMenu />

        {/* Demo Vehicle Showroom & Preset Selector (Decoupled Demo Layer) */}
        <CarSelectModal />
      </div>
    </BoundingBox>
  );
};

export default App;
