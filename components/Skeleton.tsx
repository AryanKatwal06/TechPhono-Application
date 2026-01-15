import React, { useEffect, useRef } from 'react';
import type { ViewStyle } from 'react-native';
import { Animated } from 'react-native';
export const Skeleton = ({
  height = 20,
  width = '100%',
  radius = 12,
  style,
}: {
  height?: number;
  width?: number | string;
  radius?: number;
  style?: ViewStyle | Animated.AnimatedProps<ViewStyle>;
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);
  const baseStyle = {
    height,
    width: width as any,
    borderRadius: radius,
    backgroundColor: '#E5E7EB',
    opacity,
    marginBottom: 12,
  } as const;
  return (
    <Animated.View
      style={[baseStyle as any, style as any]}
    />
  );
};