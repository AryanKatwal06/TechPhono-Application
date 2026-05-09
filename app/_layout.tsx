import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TechPhonoProvider } from '@/context/TechPhonoContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';

const queryClient = new QueryClient();

function AppNavigator() {
  const { loading, user } = useAuth();
  const router = useRouter();
  const navigationStateRef = useRef({
    isNavigating: false,
    lastNavigationTime: 0,
    processedUrls: new Set<string>()
  });

  useEffect(() => {
    let subscription: any = null;
    let navigationTimeout: any = null;

    const handleDeepLink = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl != null) {
          // Wait for auth context to be ready before processing
          if (!loading) {
            await processDeepLink(initialUrl);
          }
        }
      } catch (error) {
        console.error(' Error getting initial URL:', error);
      }

      try {
        subscription = Linking.addEventListener('url', async ({ url }) => {
          try {
            // Wait for auth context to be ready
            if (!loading) {
              await processDeepLink(url);
            }
          } catch (error) {
            console.error(' Error processing deep link:', error);
          }
        });
      } catch (error) {
        console.error(' Error setting up deep link listener:', error);
      }
    };

    const processDeepLink = async (url: string) => {
      try {
        const navigationState = navigationStateRef.current;
        
        // Skip if already navigating or recently processed this URL
        if (navigationState.isNavigating || navigationState.processedUrls.has(url)) {
          console.log('⏭️ Skipping redundant navigation for:', url);
          return;
        }

        // Filter out Expo development URLs and internal URLs
        if (url.includes('exp://') || url.includes('://localhost') || url.includes('://127.0.0.1')) {
          console.log('⏭️ Skipping internal Expo URL:', url);
          return;
        }

        console.log('🔗 Processing deep link:', url);
        
        // Mark as navigating and processed
        navigationState.isNavigating = true;
        navigationState.processedUrls.add(url);
        navigationState.lastNavigationTime = Date.now();
        
        let cleanUrl = url.replace(/^(techphono:\/\/|https:\/\/[^\/]+\/)?/, '');

        // Handle Firebase password reset / email verification links
        const isAuthAction = cleanUrl.includes('mode=') ||
          cleanUrl.includes('oobCode=') ||
          cleanUrl.includes('reset-password');

        if (isAuthAction) {
          // Firebase Auth handles email actions automatically
          // Navigate to reset-password page if it's a reset action
          if (cleanUrl.includes('mode=resetPassword') || cleanUrl.includes('reset-password')) {
            const params = new URLSearchParams(cleanUrl.split('?')[1] || '');
            const oobCode = params.get('oobCode');

            navigationTimeout = setTimeout(() => {
              try {
                if (oobCode) {
                  router.replace({
                    pathname: '/reset-password',
                    params: { oobCode }
                  } as any);
                } else {
                  router.replace('/(tabs)' as any);
                }
              } catch (error) {
                console.error(' Navigation error:', error);
              } finally {
                navigationState.isNavigating = false;
              }
            }, 300);
          } else {
            // For other auth actions (email verification, etc.), navigate to home
            navigationTimeout = setTimeout(() => {
              try {
                router.replace('/(tabs)' as any);
              } catch (error) {
                console.error(' Navigation error:', error);
              } finally {
                navigationState.isNavigating = false;
              }
            }, 300);
          }
          return;
        }

        // For other deep links (including QR scans), attempt to navigate to the exact path
        // Example: techphono://track-repair?jobId=123 -> 'track-repair'
        const [pathPart, queryPart] = cleanUrl.split('?');
        const targetPath = pathPart ? ('/' + pathPart.replace(/^\/+/, '')) : '/';

        // Defensive: parse query params safely (some QR scanners produce malformed query strings)
        let params: URLSearchParams | null = null;
        try {
          params = new URLSearchParams((queryPart || '').replace(/^#/, ''));
        } catch (err) {
          console.warn('⚠️ Failed to parse query params for deep link, ignoring params', err);
          params = null;
        }

        console.log('📍 Target path:', targetPath);
        console.log('📋 Query params:', params ? Object.fromEntries(params as any) : {});

        // If target is root or empty, do nothing
        if (!targetPath || targetPath === '/') {
          console.warn('⚠️ Empty target path, skipping navigation');
          navigationState.isNavigating = false;
          return;
        }

        // Only allow navigation to well-known app routes to avoid crashes from unexpected paths
        const allowedStarts = [
          '/admin',
          '/(tabs)',
          '/repair',
          '/track-repair',
          '/repair-history',
          '/booking',
          '/feedback',
          '/auth',
        ];
        const isAllowed = allowedStarts.some(prefix => targetPath.startsWith(prefix));
        if (!isAllowed) {
          console.warn('⚠️ Deep link target not allowed, redirecting to home:', targetPath);
          navigationState.isNavigating = false;
          navigationTimeout = setTimeout(() => {
            try {
              router.replace('/(tabs)' as any);
            } catch (error) {
              console.error(' Navigation error when redirecting to home:', error);
            }
          }, 300);
          return;
        }

        // If the user is not authenticated and target is a protected area, redirect to login
        const isProtected = targetPath.startsWith('/admin') || targetPath.startsWith('/(tabs)') || targetPath.startsWith('/repair');
        if (isProtected && !user) {
          console.log('🔐 Protected route accessed without auth, redirecting to login');
          navigationTimeout = setTimeout(() => {
            try {
              router.replace('/auth/login' as any);
            } catch (error) {
              console.error(' Navigation error:', error);
            } finally {
              navigationState.isNavigating = false;
            }
          }, 300);
          return;
        }

        // Navigate to the requested path with query params if any
        navigationTimeout = setTimeout(() => {
          try {
            console.log('🚀 Navigating to:', targetPath);
            if (params && Array.from(params.keys()).length > 0) {
              const paramsObj = Object.fromEntries(params as any);
              console.log('📦 With params:', paramsObj);
              router.replace({ pathname: targetPath, params: paramsObj } as any);
            } else {
              router.replace(targetPath as any);
            }
          } catch (error) {
            console.error(' Navigation error:', error);
            // Fallback: navigate to home
            try {
              router.replace('/(tabs)' as any);
            } catch (fallbackError) {
              console.error(' Fallback navigation failed:', fallbackError);
            }
          } finally {
            navigationState.isNavigating = false;
          }
        }, 300);
      } catch (error) {
        console.error(' Deep link processing error:', error);
        navigationStateRef.current.isNavigating = false;
        // Fallback: navigate to home
        navigationTimeout = setTimeout(() => {
          try {
            router.replace('/(tabs)' as any);
          } catch (fallbackError) {
            console.error(' Fallback navigation failed:', fallbackError);
          }
        }, 300);
      }
    };

    // Only start handling deep links when auth is loaded
    if (!loading) {
      handleDeepLink();
    } else {
      // If auth is still loading, wait for it
      const waitForAuth = async () => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        while (loading && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        if (!loading) {
          handleDeepLink();
        }
      };
      waitForAuth();
    }

    return () => {
      try {
        if (navigationTimeout) clearTimeout(navigationTimeout);
        subscription?.remove();
        // Clear processed URLs periodically to prevent memory leaks
        const navigationState = navigationStateRef.current;
        if (navigationState.processedUrls.size > 100) {
          navigationState.processedUrls.clear();
        }
      } catch (error) {
        console.error(' Error cleaning up deep link listener:', error);
      }
    };
  }, [router, loading, user]);

  // Initialize app lifecycle management for camera cleanup
  useAppLifecycle();

  if (loading) {
    return null; // or a loading spinner component
  }

  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/forgot-password" />
      <Stack.Screen name="auth/reset-password" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="booking" />
      <Stack.Screen name="track-repair" />
      <Stack.Screen name="repair-history" />
      <Stack.Screen name="feedback" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TechPhonoProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ErrorBoundary>
              <AppNavigator />
            </ErrorBoundary>
          </GestureHandlerRootView>
        </TechPhonoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}