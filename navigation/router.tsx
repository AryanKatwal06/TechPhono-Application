import { StackActions, createNavigationContainerRef, useFocusEffect as useNavigationFocusEffect, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ParamListBase } from '@react-navigation/native';

type RouteInput = string | { pathname: string; params?: Record<string, any> };

type NavigationTarget = {
  name: string;
  params?: Record<string, any>;
};

export const navigationRef = createNavigationContainerRef<ParamListBase>();

const ROUTE_NAMES = {
  splash: 'Splash',
  authLogin: 'AuthLogin',
  authRegister: 'AuthRegister',
  authForgotPassword: 'AuthForgotPassword',
  resetPassword: 'ResetPassword',
  mainTabs: 'MainTabs',
  tabHome: 'HomeTab',
  tabServices: 'ServicesTab',
  tabShop: 'ShopTab',
  tabCart: 'CartTab',
  booking: 'Booking',
  trackRepair: 'TrackRepair',
  repairHistory: 'RepairHistory',
  feedback: 'Feedback',
  adminHome: 'AdminHome',
  adminHistory: 'AdminHistory',
  adminManageItems: 'AdminManageItems',
  adminManageServices: 'AdminManageServices',
  adminRepairs: 'AdminRepairs',
  adminRepairDetail: 'AdminRepairDetail',
} as const;

function splitPathAndQuery(pathname: string) {
  const [pathOnly, queryString] = pathname.split('?');
  const params = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : undefined;
  return { pathOnly, params };
}

function resolveTarget(input: RouteInput, extraParams?: Record<string, any>): NavigationTarget {
  const pathInput = typeof input === 'string' ? input : input.pathname;
  const mergedParams = typeof input === 'string' ? extraParams : { ...(input.params ?? {}), ...(extraParams ?? {}) };
  const { pathOnly, params } = splitPathAndQuery(pathInput);
  const finalParams = { ...(params ?? {}), ...(mergedParams ?? {}) };

  if (pathOnly === '/' || pathOnly === '') {
    return { name: ROUTE_NAMES.splash, params: finalParams };
  }

  if (pathOnly === '/auth/login') return { name: ROUTE_NAMES.authLogin, params: finalParams };
  if (pathOnly === '/auth/register') return { name: ROUTE_NAMES.authRegister, params: finalParams };
  if (pathOnly === '/auth/forgot-password') return { name: ROUTE_NAMES.authForgotPassword, params: finalParams };
  if (pathOnly === '/reset-password') return { name: ROUTE_NAMES.resetPassword, params: finalParams };
  if (pathOnly === '/booking') return { name: ROUTE_NAMES.booking, params: finalParams };
  if (pathOnly === '/track-repair') return { name: ROUTE_NAMES.trackRepair, params: finalParams };
  if (pathOnly === '/repair-history') return { name: ROUTE_NAMES.repairHistory, params: finalParams };
  if (pathOnly === '/feedback') return { name: ROUTE_NAMES.feedback, params: finalParams };
  if (pathOnly === '/admin') return { name: ROUTE_NAMES.adminHome, params: finalParams };
  if (pathOnly === '/admin/history') return { name: ROUTE_NAMES.adminHistory, params: finalParams };
  if (pathOnly === '/admin/manage-items') return { name: ROUTE_NAMES.adminManageItems, params: finalParams };
  if (pathOnly === '/admin/manage-services') return { name: ROUTE_NAMES.adminManageServices, params: finalParams };
  if (pathOnly === '/admin/repairs') return { name: ROUTE_NAMES.adminRepairs, params: finalParams };
  if (pathOnly === '/admin/repair/[id]' || pathOnly === '/admin/repair') {
    return {
      name: ROUTE_NAMES.adminRepairDetail,
      params: finalParams,
    };
  }

  if (pathOnly === '/(tabs)' || pathOnly === '/(tabs)/index') {
    return { name: ROUTE_NAMES.mainTabs, params: { screen: ROUTE_NAMES.tabHome, params: finalParams } };
  }
  if (pathOnly === '/(tabs)/services') {
    return { name: ROUTE_NAMES.mainTabs, params: { screen: ROUTE_NAMES.tabServices, params: finalParams } };
  }
  if (pathOnly === '/(tabs)/shop') {
    return { name: ROUTE_NAMES.mainTabs, params: { screen: ROUTE_NAMES.tabShop, params: finalParams } };
  }
  if (pathOnly === '/(tabs)/cart') {
    return { name: ROUTE_NAMES.mainTabs, params: { screen: ROUTE_NAMES.tabCart, params: finalParams } };
  }

  if (pathOnly.startsWith('/admin/repair/') && pathOnly !== '/admin/repair/[id]') {
    const id = pathOnly.split('/').filter(Boolean).pop();
    return {
      name: ROUTE_NAMES.adminRepairDetail,
      params: { ...finalParams, id },
    };
  }

  return { name: ROUTE_NAMES.splash, params: finalParams };
}

function navigateAction(method: 'push' | 'replace', input: RouteInput, extraParams?: Record<string, any>) {
  const target = resolveTarget(input, extraParams);

  if (!navigationRef.isReady()) {
    return;
  }

  if (method === 'replace') {
    navigationRef.dispatch(StackActions.replace(target.name, target.params));
    return;
  }

  (navigationRef as any).navigate(target.name, target.params);
}

export function useRouter() {
  return useMemo(() => {
    return {
      push: (input: RouteInput, params?: Record<string, any>) => navigateAction('push', input, params),
      replace: (input: RouteInput, params?: Record<string, any>) => navigateAction('replace', input, params),
      back: () => {
        if (navigationRef.isReady() && navigationRef.canGoBack()) {
          navigationRef.goBack();
        }
      },
      canGoBack: () => navigationRef.isReady() && navigationRef.canGoBack(),
    };
  }, []);
}

export function useLocalSearchParams<T extends Record<string, any> = Record<string, any>>() {
  const route = useRoute();
  return (route.params ?? {}) as T;
}

export function Redirect({ href }: { href: RouteInput }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href]);

  return null;
}

export const useFocusEffect = useNavigationFocusEffect;

const NoopNavigator = ({ children }: { children?: ReactNode }) => <>{children}</>;
(NoopNavigator as any).Screen = () => null;
(NoopNavigator as any).Group = () => null;

export const Stack = NoopNavigator as any;
export const Tabs = NoopNavigator as any;

export const RouteNames = ROUTE_NAMES;
export const resolveNavigationTarget = resolveTarget;
