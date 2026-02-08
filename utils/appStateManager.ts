import { AppState, AppStateStatus } from 'react-native';

export class AppStateManager {
  private static instance: AppStateManager;
  private currentState: AppStateStatus = AppState.currentState;
  private listeners: ((state: AppStateStatus) => void)[] = [];
  private cleanupTasks: (() => void)[] = [];

  static getInstance(): AppStateManager {
    if (!AppStateManager.instance) {
      AppStateManager.instance = new AppStateManager();
    }
    return AppStateManager.instance;
  }

  constructor() {
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    const previousState = this.currentState;
    this.currentState = nextAppState;

    console.log(`📱 App state changed: ${previousState} → ${nextAppState}`);

    // Handle specific state transitions
    if (previousState.match(/active|foreground/) && nextAppState === 'background') {
      this.handleAppBackgrounded();
    } else if (previousState === 'background' && nextAppState.match(/active|foreground/)) {
      this.handleAppForegrounded();
    } else if (nextAppState === 'active') {
      this.handleAppActive();
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(nextAppState);
      } catch (error) {
        console.error('❌ Error in app state listener:', error);
      }
    });
  };

  private handleAppBackgrounded() {
    console.log('🌙 App going to background - performing cleanup');
    this.performCleanup();
  }

  private handleAppForegrounded() {
    console.log('☀️ App coming to foreground');
  }

  private handleAppActive() {
    console.log('🎯 App became active');
  }

  private performCleanup() {
    console.log(`🧹 Executing ${this.cleanupTasks.length} cleanup tasks`);
    
    this.cleanupTasks.forEach((task, index) => {
      try {
        task();
        console.log(`✅ Cleanup task ${index} completed`);
      } catch (error) {
        console.error(`❌ Cleanup task ${index} failed:`, error);
      }
    });
    
    // Clear cleanup tasks after execution
    this.cleanupTasks = [];
  }

  addCleanupTask(task: () => void) {
    this.cleanupTasks.push(task);
  }

  addListener(listener: (state: AppStateStatus) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (state: AppStateStatus) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  getCurrentState(): AppStateStatus {
    return this.currentState;
  }

  isBackgrounded(): boolean {
    return this.currentState === 'background';
  }

  isActive(): boolean {
    return this.currentState === 'active';
  }
}
