import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import * as Linking from 'expo-linking';
import { extractModeAndOobCode } from '@/services/dynamicLinks';
import { useRouter } from 'expo-router';

export default function AuthCallback() {
  const [processing, setProcessing] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const handleUrl = async (url: string | null) => {
      if (!url) return;
      try {
        // Try to extract mode and oobCode from either a direct link or a wrapped Dynamic Link
        const extracted = extractModeAndOobCode(url);
        const mode = extracted?.mode;
        const oobCode = extracted?.oobCode;

        // Handle password reset link
        if (mode === 'resetPassword' && oobCode) {
          // Redirect to reset screen with oobCode param
          if (mounted) {
            router.replace({ pathname: '/auth/reset-password', params: { oobCode } });
          }
          return;
        }

        // For any other auth action or invalid link, redirect to login
        if (mounted) {
          setProcessing(false);
          // Optionally show alert for debugging
          if (!mode || !oobCode) {
            console.log('ℹ️ No valid auth action found in link, redirecting to login');
          }
          router.replace('/auth/login');
        }
      } catch (err) {
        console.error('Error handling auth callback URL:', err);
        if (mounted) {
          setProcessing(false);
          Alert.alert('Error', 'Failed to process link');
          router.replace('/auth/login');
        }
      }
    };

    (async () => {
      try {
        const initial = await Linking.getInitialURL();
        await handleUrl(initial);
      } catch (err) {
        console.error('Error handling initial URL:', err);
        if (mounted) {
          setProcessing(false);
          router.replace('/auth/login');
        }
      }
    })();

    const listener = (event: { url: string }) => handleUrl(event.url);
    Linking.addEventListener('url', listener as any);

    return () => {
      mounted = false;
      Linking.removeEventListener('url', listener as any);
    };
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {processing ? <ActivityIndicator size="large" /> : null}
    </View>
  );
}