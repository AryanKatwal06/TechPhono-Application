import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAlert } from '@/context/AlertContext';
import { extractModeAndOobCode } from '@/services/dynamicLinks';
import { Linking } from 'react-native';
import { useRouter } from '@/navigation/router';

export default function AuthCallback() {
  const [processing, setProcessing] = useState(true);
  const router = useRouter();
  const alert = useAlert();

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
            router.replace({ pathname: '/reset-password', params: { oobCode } });
          }
          return;
        }

        // For any other auth action or invalid link, redirect to login
        if (mounted) {
          setProcessing(false);
          router.replace('/auth/login');
        }
      } catch (err) {
        console.error('Error handling auth callback URL:', err);
        if (mounted) {
          setProcessing(false);
          alert.error('Error', 'Failed to process link');
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
    const subscription = Linking.addEventListener('url', listener as any);

    return () => {
      mounted = false;
      try {
        subscription?.remove?.();
      } catch (e) {
        try {
          (Linking as any).removeEventListener?.('url', listener);
        } catch (_err) {}
      }
    };
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {processing ? <ActivityIndicator size="large" /> : null}
    </View>
  );
}