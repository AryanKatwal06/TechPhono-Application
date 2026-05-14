import { Platform } from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';

const trigger = (pattern: string) => {
  if (Platform.OS === 'web') {
    return Promise.resolve();
  }

  HapticFeedback.trigger(pattern as any, {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  });

  return Promise.resolve();
};

export const Haptics = {
  ImpactFeedbackStyle: {
    Light: 'impactLight',
    Medium: 'impactMedium',
    Heavy: 'impactHeavy',
    Rigid: 'impactHeavy',
    Soft: 'impactLight',
  },
  NotificationFeedbackType: {
    Success: 'notificationSuccess',
    Warning: 'notificationWarning',
    Error: 'notificationError',
  },
  impactAsync: (style: string) => trigger(style),
  notificationAsync: (type: string) => trigger(type),
  selectionAsync: () => trigger('selection'),
};

export default Haptics;
