import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface TransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  duration?: number;
}

export default function Transition({ children, isVisible, duration = 500 }: TransitionProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, duration, fadeAnim, scaleAnim]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        flex: 1,
      }}
    >
      {children}
    </Animated.View>
  );
}
