import { useEffect, useState } from 'react';

// false on the first render, true a moment later. Charts start collapsed and grow into place.
export function useReady(delayMs = 40) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return ready;
}
