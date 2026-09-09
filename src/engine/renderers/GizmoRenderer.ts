import { RearTouchController } from '../RearTouchController';
import { CarPhysicsConfig } from '../../stores/useCarConfigStore';

/**
 * Renders the Rear-Touch Push interactive circle and tether gizmo
 */
export function drawRearTouchGizmo(
  ctx: CanvasRenderingContext2D,
  gizmo: RearTouchController['gizmo'],
  config: CarPhysicsConfig
): void {
  ctx.save();

  // 1. Rear Bumper Anchor Point
  ctx.fillStyle = '#00f2fe';
  ctx.beginPath();
  ctx.arc(gizmo.anchorWorldX, gizmo.anchorWorldY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Push-zone boundary circle centered at the anchor
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(gizmo.anchorWorldX, gizmo.anchorWorldY, config.rearPushRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Deadzone circle
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(gizmo.anchorWorldX, gizmo.anchorWorldY, config.rearDeadzone, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Elastic Tether Line from Rear Anchor to Finger
  const isAccelerating = gizmo.throttle > 0;
  const isBraking = gizmo.throttle < 0;
  const tetherColor = isBraking ? '#ff3366' : isAccelerating ? '#00f2fe' : '#94a3b8';

  ctx.strokeStyle = tetherColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(gizmo.anchorWorldX, gizmo.anchorWorldY);
  ctx.lineTo(gizmo.touchWorldX, gizmo.touchWorldY);
  ctx.stroke();

  // 3. Finger Touch Point Indicator Ring
  ctx.fillStyle = isBraking ? 'rgba(255, 51, 102, 0.3)' : 'rgba(0, 242, 254, 0.3)';
  ctx.beginPath();
  ctx.arc(gizmo.touchWorldX, gizmo.touchWorldY, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = tetherColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(gizmo.touchWorldX, gizmo.touchWorldY, 22, 0, Math.PI * 2);
  ctx.stroke();

  // Center touch dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(gizmo.touchWorldX, gizmo.touchWorldY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
