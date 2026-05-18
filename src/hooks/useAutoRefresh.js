import { useEffect, useRef } from 'react';

/**
 * Auto-refresh hook using polling
 * @param {Function} callback - Function to call on each interval
 * @param {number} interval - Interval in milliseconds (default: 5000)
 * @param {boolean} enabled - Whether auto-refresh is active
 */
export function useAutoRefresh(callback, interval = 5000, enabled = true) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, interval);

    return () => clearInterval(id);
  }, [interval, enabled]);
}
