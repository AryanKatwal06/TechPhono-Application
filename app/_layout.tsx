import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TechPhonoProvider } from '@/context/TechPhonoContext';
import { supabase } from '@/services/supabaseClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';

const queryClient = new QueryClient();

function AppNavigator() {
  const { loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let subscription: any = null;
    let isProcessing = false;
    
    const handleDeepLink = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl != null) {
          await processDeepLink(initialUrl);
        }
      } catch (error) {
        console.error(' Error getting initial URL:', error);
      }
      
      try {
        subscription = Linking.addEventListener('url', async ({ url }) => {
          try {
            await processDeepLink(url);
          } catch (error) {
            console.error(' Error processing deep link:', error);
          }
        });
      } catch (error) {
        console.error(' Error setting up deep link listener:', error);
      }
    };

    const processDeepLink = async (url: string) => {
      if (isProcessing) return;
      isProcessing = true;
      
      try {
        let cleanUrl = url.replace(/^(techphono:\/\/|https:\/\/[^\/]+\/)?/, '');
        const isCallback = cleanUrl.includes('callback') || 
                          cleanUrl.includes('auth') ||
                          cleanUrl.includes('access_token');
                          
        if (isCallback) {
          const [, paramsPart] = cleanUrl.includes('#')
            ? cleanUrl.split('#')
            : cleanUrl.split('?');
          const params = new URLSearchParams(paramsPart || '');
          let accessToken = params.get('access_token');
          let refreshToken = params.get('refresh_token');
          
          if (!accessToken && paramsPart) {
            paramsPart.split('&').forEach((pair: string) => {
              const [key, value] = pair.split('=');
              if (key === 'access_token') accessToken = decodeURIComponent(value || '');
              if (key === 'refresh_token') refreshToken = decodeURIComponent(value || '');
            });
          }
          
          if (accessToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            setTimeout(() => {
              try {
                router.replace('/(tabs)');
              } catch (error) {
                console.error(' Navigation error:', error);
              }
              isProcessing = false;
            }, 1000);
          } else {
            isProcessing = false;
          }
        } else {
          isProcessing = false;
        }
      } catch (error) {
        console.error(' Deep link processing error:', error);
        isProcessing = false;
      }
    };

    handleDeepLink();
    
    return () => {
      try {
        subscription?.remove();
      } catch (error) {
        console.error(' Error removing deep link listener:', error);
      }
    };
  }, [router]);

  // Initialize app lifecycle management for camera cleanup
  useAppLifecycle();

  if (loading) {
    return null; // or a loading spinner component
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
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