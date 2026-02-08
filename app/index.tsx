import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        try {
          if (user) {
            router.replace('/(tabs)');
          } else {
            router.replace('/auth/login');
          }
        } catch (error) {
          console.error('❌ Navigation error in index:', error);
        }
      }, 3000); // Extended to 3 seconds for better splash screen experience
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  return (
    <ErrorBoundary>
      <SplashScreen />
    </ErrorBoundary>
  );
}