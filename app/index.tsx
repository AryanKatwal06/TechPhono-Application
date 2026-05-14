import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/navigation/router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '@/components/SplashScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Index() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const navigationAttempted = useState(false)[1];

  useEffect(() => {
    const checkAndNavigate = async () => {
      try {
        // Only show splash screen on initial app load, not after redirects
        const hasSeenSplash = await AsyncStorage.getItem('hasSeenSplash');
        
        if (hasSeenSplash === 'true') {
          // If splash already shown, navigate immediately
          if (user) {
            router.replace(isAdmin ? '/admin' : '/(tabs)');
          } else {
            router.replace('/auth/login');
          }
          setShowSplash(false);
        } else if (!loading) {
          // First time app load - show splash briefly then navigate
          const timer = setTimeout(async () => {
            try {
              if (user) {
                router.replace(isAdmin ? '/admin' : '/(tabs)');
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
          router.replace(isAdmin ? '/admin' : '/(tabs)');
        } else {
          router.replace('/auth/login');
        }
        setShowSplash(false);
      }
    };

    checkAndNavigate();
  }, [user, loading, isAdmin, router]);

  // Force navigation after 5 seconds as a timeout fallback
  useEffect(() => {
    const timeoutTimer = setTimeout(() => {
      if (showSplash) {
        console.warn('⚠️ Splash screen timeout - forcing navigation');
        if (user) {
          router.replace(isAdmin ? '/admin' : '/(tabs)');
        } else {
          router.replace('/auth/login');
        }
        setShowSplash(false);
      }
    }, 5000);

    return () => clearTimeout(timeoutTimer);
  }, [showSplash, user, isAdmin, router]);

  if (!showSplash) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SplashScreen />
    </ErrorBoundary>
  );
}