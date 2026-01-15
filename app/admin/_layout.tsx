import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
export default function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }
  if (!user) {
    return <Redirect href="/auth/login" />;
  }
  if (!isAdmin) {
    return <Redirect href="/(tabs)" />;
  }
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}