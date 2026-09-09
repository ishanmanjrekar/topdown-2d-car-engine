import { useEffect, useRef } from 'react';

/**
 * useGameLoop Hook
 * 
 * High-performance requestAnimationFrame loop with fixed-timestep physics accumulation.
 * Provides deterministic simulation across variable refresh rates (60Hz, 120Hz, 144Hz)
 * while preventing multiple redundant canvas render passes per display frame.
 * 
 * @param callback Called for each fixed physics substep. `shouldRender` is true on the final substep of each frame.
 * @param fixedStepMs Discrete physics step duration (default: ~8.333ms / 120Hz for sub-pixel accuracy and high-refresh support).
 * @param maxDeltaTime Clamp threshold for background tab recovery (default: 100ms).
 */
export function useGameLoop(
  callback: (deltaTimeMs: number, shouldRender: boolean) => void,
  fixedStepMs: number = 1000 / 120, // 8.333ms (120Hz fixed step)
  maxDeltaTime: number = 100
) {
  const requestRef = useRef<number>(undefined);
  const previousTimeRef = useRef<number>(undefined);
  const accumulatorRef = useRef<number>(0);

  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const frameTime = Math.min(time - previousTimeRef.current, maxDeltaTime);
        accumulatorRef.current += frameTime;

        // Calculate how many fixed substeps to execute (capped at 4 to prevent spiral of death)
        const stepsToRun = Math.min(Math.floor(accumulatorRef.current / fixedStepMs), 4);

        if (stepsToRun > 0) {
          for (let step = 0; step < stepsToRun; step++) {
            const isLastStep = step === stepsToRun - 1;
            callbackRef.current(fixedStepMs, isLastStep);
            accumulatorRef.current -= fixedStepMs;
          }
        } else {
          // If frame interval was faster than fixedStepMs (e.g. 144Hz/165Hz display), run 1 step so motion never freezes
          callbackRef.current(fixedStepMs, true);
          accumulatorRef.current = Math.max(0, accumulatorRef.current - fixedStepMs);
        }

        // Prevent accumulator runaway if tab was severely backgrounded
        if (accumulatorRef.current > fixedStepMs * 4) {
          accumulatorRef.current = 0;
        }
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      previousTimeRef.current = undefined;
      accumulatorRef.current = 0;
    };
  }, [fixedStepMs, maxDeltaTime]);
}
