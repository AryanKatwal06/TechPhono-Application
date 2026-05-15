import AppLogo from '@/components/AppLogo';
import { borderRadius, colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { ValidationUtils } from '@/utils/validation';
import { useRouter } from '@/navigation/router';
import { Haptics } from '@/utils/haptics';
// lucide icons removed (unused)
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  
} from 'react-native';
import AuthFeedback from '@/components/AuthFeedback';
import LinearGradient from 'react-native-linear-gradient';

// Responsive values
const getResponsiveValues = () => {
  const { width } = Dimensions.get('window');
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  
  return {
    isTablet,
    isDesktop,
    spacing_val: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
      xxxl: 64,
      horizontalPadding: 24,
      inputHeight: 48,
      buttonHeight: 48,
    },
    typography_val: {
      h2: isDesktop ? 32 : 28,
      body: 16,
      bodySmall: 14,
      label: 14,
    },
  };
};

export default function ForgotPassword() {
  const router = useRouter();
  const { isTablet, isDesktop, spacing_val, typography_val } = getResponsiveValues();
  const { resetPassword } = useAuth();
  const alert = useAlert();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Super smooth animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Super smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Super smooth navigation animation
  const animateNavigation = async (callback: () => void) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    
    // Smooth exit animation
    await new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        resolve();
      });
    });
    
    callback();
  };

  const handleReset = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert.error('Error', 'Please enter your email address');
      return;
    }

    if (!ValidationUtils.isValidEmail(cleanEmail)) {
      alert.error('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const error = await resetPassword(cleanEmail);
    setLoading(false);
    if (error) {
      alert.error('Error', error);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      alert.success('Success', 'A password reset email has been sent to you. The link expires in 5 minutes and can only be used once.');
      setTimeout(() => {
        router.replace('/auth/login');
      }, 1000);
    }
  };

  return (
    <LinearGradient
      colors={['rgba(147, 197, 253, 0.3)', 'rgba(196, 181, 253, 0.3)', 'rgba(251, 207, 232, 0.3)']}
      style={styles.gradientOverlay}
    >
        <KeyboardAvoidingView
          style={[styles.container, { paddingHorizontal: spacing_val.horizontalPadding }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}>
            <View style={styles.centeredContainer}>
              <View style={styles.contentGroup}>
                <View style={styles.logoContainer}>
                  <AppLogo size={isDesktop ? 200 : isTablet ? 180 : 160} />
                </View>
                
                <View style={styles.formContainer}>
                  <Text style={[styles.title, { fontSize: typography_val.h2, marginBottom: spacing_val.sm }]}>Forgot Password</Text>
                  <Text style={[styles.subtitle, { fontSize: typography_val.bodySmall, marginBottom: spacing_val.lg }]}>
                    Enter your registered email address to receive a password reset link
                  </Text>
                  
                  <View style={styles.form}>
                    <Text style={[styles.label, { fontSize: typography_val.label, marginBottom: spacing_val.sm }]}>Email Address</Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        {
                          minHeight: spacing_val.inputHeight,
                          borderRadius: borderRadius.md,
                          paddingHorizontal: spacing_val.md,
                          paddingVertical: spacing_val.sm,
                          fontSize: typography_val.body,
                          marginBottom: spacing_val.md,
                        },
                      ]}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.textLight}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                    />

                    <TouchableOpacity
                      style={[
                        styles.button,
                        {
                          paddingVertical: spacing_val.md,
                          borderRadius: borderRadius.md,
                          marginBottom: spacing_val.md,
                          minHeight: spacing_val.buttonHeight,
                        },
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={handleReset}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.buttonText, { fontSize: typography_val.body }]}>
                        {loading ? 'Sending Reset Link…' : 'Send Reset Link'}
                      </Text>
                    </TouchableOpacity>

                    <AuthFeedback visible={loading} message={loading ? 'Sending Reset Link…' : undefined} />

                    <View style={styles.loginLinkContainer}>
                      <Text style={[styles.loginText, { fontSize: typography_val.body }]}>Remember your password? </Text>
                      <TouchableOpacity onPress={() => animateNavigation(() => router.replace('/auth/login'))}>
                        <Text style={[styles.loginLink, { fontSize: typography_val.body }]}>Sign In</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  container: { 
    flex: 1, 
    backgroundColor: 'transparent',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
    paddingHorizontal: spacing.lg,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentGroup: {
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: { 
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: { 
    width: '100%',
  },
  label: { fontWeight: '600', color: colors.text },
  inputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.4)',
    color: colors.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontWeight: '600', color: colors.card },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: spacing.lg },
  loginText: { color: colors.textSecondary },
  loginLink: { fontWeight: '600', color: '#6366f1' },
});