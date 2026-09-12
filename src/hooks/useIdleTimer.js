import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

// Calls onIdle once the user has gone `timeoutMs` without any of the
// activity events firing. Resets silently on every qualifying event --
// no state, no re-renders, just a single setTimeout that keeps getting
// pushed back.
export function useIdleTimer({ timeoutMs, onIdle, enabled }) {
  const timerRef = useRef(null);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle; // always call the latest callback
 
  useEffect(() => {
    if (!enabled) return;

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onIdleRef.current(), timeoutMs);
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer(); // start the clock as soon as this mounts

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [enabled, timeoutMs]);
}