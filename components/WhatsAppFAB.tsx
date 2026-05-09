import { openWhatsAppChat } from '@/services/whatsapp';
import { useResponsiveComponentSizes } from '@/utils/responsive';
import * as Haptics from 'expo-haptics';
import { MessageCircle } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Alert, Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';

export const WhatsAppFAB: React.FC = () => {
  const { height } = useWindowDimensions();
  const componentSizes = useResponsiveComponentSizes();

  const handlePress = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await openWhatsAppChat();
    } catch {
      Alert.alert(
        'WhatsApp not available',
        'Please install WhatsApp to contact support.'
      );
    }
  };

  // Calculate responsive position - account for tab bar height
  const tabBarHeight = Platform.OS === 'ios' ? 84 : 70;
  const bottomPosition = Math.max(componentSizes.fabMargin + tabBarHeight, 20);

  const fabStyles = useMemo(
    () => ({
      position: 'absolute' as const,
      right: componentSizes.fabMargin,
      bottom: bottomPosition,
      width: componentSizes.fabSize,
      height: componentSizes.fabSize,
      borderRadius: componentSizes.fabSize / 2,
      backgroundColor: '#25D366',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    }),
    [componentSizes.fabSize, componentSizes.fabMargin, bottomPosition]
  );

  return (
    <TouchableOpacity
      style={fabStyles}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <MessageCircle size={componentSizes.iconMd} color="#FFFFFF" strokeWidth={2.5} />
    </TouchableOpacity>
  );
};

export default WhatsAppFAB;