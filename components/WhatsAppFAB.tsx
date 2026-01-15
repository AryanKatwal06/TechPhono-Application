import { openWhatsAppChat } from '@/services/whatsapp';
import * as Haptics from 'expo-haptics';
import { MessageCircle } from 'lucide-react-native';
import React from 'react';
import { Alert, Platform, StyleSheet, TouchableOpacity } from 'react-native';
export const WhatsAppFAB: React.FC = () => {
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
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <MessageCircle size={28} color="#FFFFFF" strokeWidth={2.5} />
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
});