import React from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { NavigationContainer, DefaultTheme, LinkingOptions, StackActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HapticFeedback from 'react-native-haptic-feedback';
import { Home, ShoppingBag, ShoppingCart, Wrench } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { navigationRef, RouteNames } from '@/navigation/router';

import SplashScreen from '@/components/SplashScreen';
import { useAuth } from '@/context/AuthContext';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';

import SplashEntry from '@/app/index';
import LoginScreen from '@/app/auth/login';
import RegisterScreen from '@/app/auth/register';
import ForgotPasswordScreen from '@/app/auth/forgot-password';
import ResetPasswordScreen from '@/app/reset-password';
import BookingScreen from '@/app/booking';
import TrackRepairScreen from '@/app/track-repair';
import RepairHistoryScreen from '@/app/repair-history';
import FeedbackScreen from '@/app/feedback';
import AdminHomeScreen from '@/app/admin/index';
import AdminHistoryScreen from '@/app/admin/history';
import AdminManageItemsScreen from '@/app/admin/manage-items';
import AdminManageServicesScreen from '@/app/admin/manage-services';
import AdminRepairsScreen from '@/app/admin/repairs';
import AdminRepairDetailScreen from '@/app/admin/repair/[id]';
import HomeTabScreen from '@/app/(tabs)/index';
import ServicesTabScreen from '@/app/(tabs)/services';
import ShopTabScreen from '@/app/(tabs)/shop';
import CartTabScreen from '@/app/(tabs)/cart';

const RootStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

  const linking: LinkingOptions<any> = {
  prefixes: ['techphono://'],
  config: {
    screens: {
      [RouteNames.splash]: '',
      [RouteNames.authLogin]: 'auth/login',
      [RouteNames.authRegister]: 'auth/register',
      [RouteNames.authForgotPassword]: 'auth/forgot-password',
      [RouteNames.resetPassword]: 'reset-password',
      [RouteNames.mainTabs]: {
        screens: {
          [RouteNames.tabHome]: '',
          [RouteNames.tabServices]: 'services',
          [RouteNames.tabShop]: 'shop',
          [RouteNames.tabCart]: 'cart',
        },
      },
      [RouteNames.booking]: 'booking',
      [RouteNames.trackRepair]: 'track-repair',
      [RouteNames.repairHistory]: 'repair-history',
      [RouteNames.feedback]: 'feedback',
      [RouteNames.adminHome]: 'admin',
      [RouteNames.adminHistory]: 'admin/history',
      [RouteNames.adminManageItems]: 'admin/manage-items',
      [RouteNames.adminManageServices]: 'admin/manage-services',
      [RouteNames.adminRepairs]: 'admin/repairs',
      [RouteNames.adminRepairDetail]: 'admin/repair/:id',
    },
  },
};

function TabsNavigator() {
  const { isAdmin } = useAuth();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (isAdmin && navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.replace(RouteNames.adminHome));
    }
  }, [isAdmin]);

  const tabBarHeight = Platform.OS === 'ios' ? 84 : 70;

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: tabBarHeight + insets.bottom,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10 + insets.bottom,
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
        name={RouteNames.tabHome}
        component={HomeTabScreen}
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
            if (Platform.OS !== 'web') HapticFeedback.trigger('selection', { enableVibrateFallback: true, ignoreAndroidSystemSettings: false });
          },
        }}
      />
      <Tabs.Screen
        name={RouteNames.tabServices}
        component={ServicesTabScreen}
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
            if (Platform.OS !== 'web') HapticFeedback.trigger('selection', { enableVibrateFallback: true, ignoreAndroidSystemSettings: false });
          },
        }}
      />
      <Tabs.Screen
        name={RouteNames.tabShop}
        component={ShopTabScreen}
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
            if (Platform.OS !== 'web') HapticFeedback.trigger('selection', { enableVibrateFallback: true, ignoreAndroidSystemSettings: false });
          },
        }}
      />
      <Tabs.Screen
        name={RouteNames.tabCart}
        component={CartTabScreen}
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
            if (Platform.OS !== 'web') HapticFeedback.trigger('selection', { enableVibrateFallback: true, ignoreAndroidSystemSettings: false });
          },
        }}
      />
    </Tabs.Navigator>
  );
}

function SplashGate() {
  return <SplashEntry />;
}

export default function RootNavigator() {
  useAppLifecycle();

  const theme = React.useMemo(() => ({
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.card,
      primary: colors.primary,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  }), []);

  return (
    <NavigationContainer ref={navigationRef} linking={linking} theme={theme}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <RootStack.Navigator initialRouteName={RouteNames.splash} screenOptions={{ headerShown: false }}>
        <RootStack.Screen name={RouteNames.splash} component={SplashGate} />
        <RootStack.Screen name={RouteNames.authLogin} component={LoginScreen} />
        <RootStack.Screen name={RouteNames.authRegister} component={RegisterScreen} />
        <RootStack.Screen name={RouteNames.authForgotPassword} component={ForgotPasswordScreen} />
        <RootStack.Screen name={RouteNames.resetPassword} component={ResetPasswordScreen} />
        <RootStack.Screen name={RouteNames.mainTabs} component={TabsNavigator} />
        <RootStack.Screen name={RouteNames.booking} component={BookingScreen} />
        <RootStack.Screen name={RouteNames.trackRepair} component={TrackRepairScreen} />
        <RootStack.Screen name={RouteNames.repairHistory} component={RepairHistoryScreen} />
        <RootStack.Screen
          name={RouteNames.feedback}
          component={FeedbackScreen}
          options={{
            headerShown: true,
            headerTitle: 'Feedback',
            headerShadowVisible: false,
            headerLeft: () => <View />,
          }}
        />
        <RootStack.Screen name={RouteNames.adminHome} component={AdminHomeScreen} />
        <RootStack.Screen name={RouteNames.adminHistory} component={AdminHistoryScreen} />
        <RootStack.Screen name={RouteNames.adminManageItems} component={AdminManageItemsScreen} />
        <RootStack.Screen name={RouteNames.adminManageServices} component={AdminManageServicesScreen} />
        <RootStack.Screen name={RouteNames.adminRepairs} component={AdminRepairsScreen} />
        <RootStack.Screen name={RouteNames.adminRepairDetail} component={AdminRepairDetailScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
