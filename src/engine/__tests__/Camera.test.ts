import { describe, it, expect, beforeEach } from 'vitest';
import { Camera } from '../Camera';

describe('Camera', () => {
  let camera: Camera;

  beforeEach(() => {
    camera = new Camera(0, 0, -Math.PI / 2);
    camera.setViewport(480, 880);
  });

  it('initializes with expected viewport and rotation', () => {
    expect(camera.viewportWidth).toBe(480);
    expect(camera.viewportHeight).toBe(880);
    expect(camera.anchorYFactor).toBe(0.60);
    expect(camera.rotation).toBeCloseTo(0, 4); // (-PI/2 + PI/2 = 0)
  });

  it('performs bijective screenToWorld and worldToScreen inversion', () => {
    camera.x = 150;
    camera.y = -220;
    camera.rotation = 0.45;
    camera.zoom = 1.15;

    const testPoints = [
      { x: 0, y: 0 },
      { x: 240, y: 528 }, // Anchor point on screen
      { x: 100, y: 700 },
      { x: -300, y: 400 },
    ];

    for (const pt of testPoints) {
      const world = camera.screenToWorld(pt.x, pt.y);
      const backToScreen = camera.worldToScreen(world.x, world.y);

      expect(backToScreen.x).toBeCloseTo(pt.x, 2);
      expect(backToScreen.y).toBeCloseTo(pt.y, 2);
    }
  });

  it('smoothly follows car with lookahead vector', () => {
    const dt = 1 / 60;
    const initialCamY = camera.y;

    // Car driving North (-Y) at 200 px/s
    camera.update(0, -100, -Math.PI / 2, 0, -200, dt);

    // Camera should move toward target with lookahead
    expect(camera.y).toBeLessThan(initialCamY);
  });
});
