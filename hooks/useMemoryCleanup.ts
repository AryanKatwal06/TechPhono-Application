import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useMemoryCleanup() {
  const timers = useRef<number[]>([]);
  const intervals = useRef<number[]>([]);
  const listeners = useRef<(() => void)[]>([]);

  useEffect(() => {
    return () => {
      // Clear all timers
      timers.current.forEach(timer => clearTimeout(timer));
      timers.current = [];
      
      // Clear all intervals
      intervals.current.forEach(interval => clearInterval(interval));
      intervals.current = [];
      
      // Remove all listeners
      listeners.current.forEach(listener => {
        try {
          listener();
        } catch (error) {
          console.error('❌ Error removing listener:', error);
        }
      });
      listeners.current = [];
      
      console.log('🧹 Memory cleanup completed');
    };
  }, []);

  const addTimer = (timer: number) => {
    timers.current.push(timer);
  };

  const addInterval = (interval: number) => {
    intervals.current.push(interval);
  };

  const addListener = (listener: () => void) => {
    listeners.current.push(listener);
  };

  const setTimeout = (callback: () => void, delay: number) => {
    const timer = global.setTimeout(callback, delay) as number;
    addTimer(timer);
    return timer;
  };

  const setInterval = (callback: () => void, delay: number) => {
    const interval = global.setInterval(callback, delay) as number;
    addInterval(interval);
    return interval;
  };

  return {
    addTimer,
    addInterval,
    addListener,
    setTimeout,
    setInterval
  };
}
