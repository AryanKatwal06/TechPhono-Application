import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { CameraUtils } from '@/utils/cameraUtils';

export function useAppLifecycle() {
  const appState = useRef(AppState.currentState);
  const cleanupTasks = useRef<(() => void)[]>([]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active|foreground/) && 
          nextAppState === 'background') {
        // App is going to background - perform cleanup
        performCleanup();
      } else if (appState.current === 'background' && 
                 nextAppState.match(/active|foreground/)) {
        // App is coming to foreground
        console.log('📱 App coming to foreground');
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      performCleanup();
    };
  }, []);

  const performCleanup = () => {
    console.log('🧹 Performing app cleanup...');
    
    // Clean up camera resources
    CameraUtils.cleanup();
    
    // Execute all registered cleanup tasks
    cleanupTasks.current.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('❌ Error during cleanup task:', error);
      }
    });
    
    // Clear cleanup tasks
    cleanupTasks.current = [];
  };

  const addCleanupTask = (task: () => void) => {
    cleanupTasks.current.push(task);
  };

  return { addCleanupTask };
}
