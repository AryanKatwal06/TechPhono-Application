import { borderRadius, colors, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabaseClient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      if (error) throw error;
      Alert.alert(
        'Success', 
        'Your password has been updated successfully.',
        [{ text: 'Login', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error: any) {
      Alert.alert('Update Failed', error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={container}>
      <Text style={title}>Set New Password</Text>
      <Text style={subtitle}>
        Please enter your new password below to complete the reset process.
      </Text>
      <TextInput
        placeholder="New Password"
        placeholderTextColor={colors.textLight}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={input}
        autoCapitalize="none"
      />
      <TouchableOpacity 
        style={[button, loading && { opacity: 0.7 }]} 
        onPress={handleUpdatePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={buttonText}>Update Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
const container: ViewStyle = {
  flex: 1, 
  padding: spacing.lg, 
  justifyContent: 'center', 
  backgroundColor: colors.background 
};
const title: TextStyle = {
  fontSize: 24, 
  fontWeight: '700', 
  color: colors.text, 
  marginBottom: spacing.sm 
};
const subtitle: TextStyle = {
  fontSize: 16, 
  color: colors.textSecondary, 
  marginBottom: spacing.xl 
};
const input: TextStyle = {
  backgroundColor: colors.card,
  padding: spacing.md,
  borderRadius: borderRadius.md,
  marginTop: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
  fontSize: 16,
  color: colors.text,
};
const button: ViewStyle = {
  marginTop: spacing.xl,
  backgroundColor: colors.primary,
  padding: spacing.md,
  borderRadius: borderRadius.md,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};
const buttonText: TextStyle = {
  color: '#fff', 
  fontWeight: '600', 
  fontSize: 16 
};