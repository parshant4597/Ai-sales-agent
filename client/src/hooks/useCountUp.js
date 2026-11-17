import { useEffect, useRef, useState } from 'react';

const easeOut = (progress) => 1 - (1 - progress) ** 3;
const FRAME_MS = 16;

// Counts from the previous value to `target`, so numbers glide when the range changes.
// Uses a timer instead of requestAnimationFrame so it still finishes in a background tab.
export function useCountUp(target, durationMs = 800) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duration = reduceMotion ? 0 : durationMs;
    const startedAt = Date.now();

    const timer = setInterval(() => {
      const progress = duration === 0 ? 1 : Math.min((Date.now() - startedAt) / duration, 1);
      const current = from + (target - from) * easeOut(progress);
      fromRef.current = current;
      setValue(current);
      if (progress === 1) clearInterval(timer);
    }, FRAME_MS);

    return () => clearInterval(timer);
  }, [target, durationMs]);

  return value;
}
