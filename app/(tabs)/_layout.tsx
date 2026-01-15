import { colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  Wrench,
} from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 84 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Home
              size={focused ? size + 2 : size}
              color={color}
              strokeWidth={focused ? 2.6 : 2}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
          },
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size, focused }) => (
            <Wrench
              size={focused ? size + 2 : size}
              color={color}
              strokeWidth={focused ? 2.6 : 2}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
          },
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size, focused }) => (
            <ShoppingBag
              size={focused ? size + 2 : size}
              color={color}
              strokeWidth={focused ? 2.6 : 2}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
          },
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size, focused }) => (
            <ShoppingCart
              size={focused ? size + 2 : size}
              color={color}
              strokeWidth={focused ? 2.6 : 2}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
          },
        }}
      />
    </Tabs>
  );
}