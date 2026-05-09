import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '@/components/SplashScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const checkAndNavigate = async () => {
      if (!loading) {
        try {
          // Only show splash screen on initial app load, not after redirects
          const hasSeenSplash = await AsyncStorage.getItem('hasSeenSplash');
          
          if (hasSeenSplash === 'true') {
            // If splash already shown, navigate immediately
            if (user) {
              router.replace('/(tabs)');
            } else {
              router.replace('/auth/login');
            }
            setShowSplash(false);
          } else {
            // First time app load - show splash briefly then navigate
            const timer = setTimeout(async () => {
              try {
                if (user) {
                  router.replace('/(tabs)');
                } else {
                  router.replace('/auth/login');
                }
                await AsyncStorage.setItem('hasSeenSplash', 'true');
                setShowSplash(false);
              } catch (error) {
                console.error('❌ Navigation error in index:', error);
              }
            }, 1000); // Reduced to 1 second since user finds 3 seconds irritating
            return () => clearTimeout(timer);
          }
        } catch (error) {
          console.error('❌ AsyncStorage error:', error);
          // Fallback to immediate navigation if AsyncStorage fails
          if (user) {
            router.replace('/(tabs)');
          } else {
            router.replace('/auth/login');
          }
          setShowSplash(false);
        }
      }
    };

    checkAndNavigate();
  }, [user, loading, router]);

  if (!showSplash) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SplashScreen />
    </ErrorBoundary>
  );
}