import AppLogo from '@/components/AppLogo';
import AuthFeedback from '@/components/AuthFeedback';
import { borderRadius, colors, spacing } from '@/constants/theme';
import { auth } from '@/services/firebaseClient';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useLocalSearchParams, useRouter } from '@/navigation/router';
import { Eye, EyeOff } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

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
    componentSizes: {
      iconMd: 20,
    },
  };
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ oobCode?: string | string[] }>();
  const oobCode = useMemo(() => {
    const value = params.oobCode;
    return Array.isArray(value) ? value[0] : value;
  }, [params.oobCode]);

  const { isTablet, isDesktop, spacing_val, typography_val, componentSizes } = getResponsiveValues();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    let active = true;

    const verifyCode = async () => {
      if (!oobCode) {
        if (active) {
          setError('This password reset link is missing its verification code. Please request a new link.');
          setVerifying(false);
        }
        return;
      }

      try {
        const accountEmail = await verifyPasswordResetCode(auth, oobCode);
        if (!active) return;

        setEmail(accountEmail);
        setError('');
      } catch (err: any) {
        if (!active) return;

        setError(
          err?.code === 'auth/expired-action-code' || err?.code === 'auth/invalid-action-code'
            ? 'This reset link is no longer valid. Please request a new password reset email.'
            : err?.message || 'Unable to verify this reset link.'
        );
      } finally {
        if (active) {
          setVerifying(false);
        }
      }
    };

    verifyCode();

    return () => {
      active = false;
    };
  }, [oobCode]);

  const handleUpdatePassword = async () => {
    if (!oobCode) {
      setError('Missing password reset code. Please request a new link.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode, password);
      router.replace('/auth/login');
    } catch (err: any) {
      setError(
        err?.code === 'auth/expired-action-code' || err?.code === 'auth/invalid-action-code'
          ? 'This reset link is no longer valid. Please request a new password reset email.'
          : err?.code === 'auth/weak-password'
            ? 'Choose a stronger password.'
            : err?.message || 'Unable to update the password.'
      );
    } finally {
      setLoading(false);
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
        <Animated.ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.centeredContainer}>
            <View style={styles.contentGroup}>
              <View style={styles.logoContainer}>
                <AppLogo size={isDesktop ? 200 : isTablet ? 180 : 160} />
              </View>

              <View style={styles.formContainer}>
                <Text style={[styles.title, { fontSize: typography_val.h2, marginBottom: spacing_val.sm }]}>Reset Password</Text>
                <Text style={[styles.subtitle, { fontSize: typography_val.bodySmall, marginBottom: spacing_val.lg }]}>Create a new password to continue</Text>

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
                    editable={false}
                  />

                  <Text style={[styles.label, { fontSize: typography_val.label, marginBottom: spacing_val.sm }]}>New Password</Text>
                  <View
                    style={[
                      styles.passwordContainer,
                      {
                        minHeight: spacing_val.inputHeight,
                        borderRadius: borderRadius.md,
                        paddingHorizontal: spacing_val.md,
                        marginBottom: spacing_val.md,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.passwordInput, { flex: 1, color: colors.text, fontSize: typography_val.body }]}
                      placeholder="Enter your new password"
                      placeholderTextColor={colors.textLight}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setError('');
                      }}
                      secureTextEntry={!passwordVisible}
                      editable={!verifying && !loading}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={[styles.eyeButton, { padding: spacing_val.sm }]}>
                      {passwordVisible ? (
                        <EyeOff size={componentSizes.iconMd} color={colors.textSecondary} />
                      ) : (
                        <Eye size={componentSizes.iconMd} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.label, { fontSize: typography_val.label, marginBottom: spacing_val.sm }]}>Confirm Password</Text>
                  <View
                    style={[
                      styles.passwordContainer,
                      {
                        minHeight: spacing_val.inputHeight,
                        borderRadius: borderRadius.md,
                        paddingHorizontal: spacing_val.md,
                        marginBottom: spacing_val.md,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.passwordInput, { flex: 1, color: colors.text, fontSize: typography_val.body }]}
                      placeholder="Confirm your new password"
                      placeholderTextColor={colors.textLight}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        setError('');
                      }}
                      secureTextEntry={!confirmPasswordVisible}
                      editable={!verifying && !loading}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} style={[styles.eyeButton, { padding: spacing_val.sm }]}>
                      {confirmPasswordVisible ? (
                        <EyeOff size={componentSizes.iconMd} color={colors.textSecondary} />
                      ) : (
                        <Eye size={componentSizes.iconMd} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {error ? (
                    <Text style={[styles.errorText, { fontSize: typography_val.bodySmall, marginBottom: spacing_val.md }]}>{error}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        paddingVertical: spacing_val.md,
                        borderRadius: borderRadius.md,
                        marginBottom: spacing_val.md,
                        minHeight: spacing_val.buttonHeight,
                      },
                      (loading || verifying) && styles.buttonDisabled,
                    ]}
                    onPress={handleUpdatePassword}
                    disabled={loading || verifying}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.buttonText, { fontSize: typography_val.body }]}>
                      {loading ? 'Resetting Password…' : verifying ? 'Verifying Link…' : 'Reset Password'}
                    </Text>
                  </TouchableOpacity>

                  <AuthFeedback visible={loading || verifying} message={verifying ? 'Verifying Link…' : loading ? 'Resetting Password…' : undefined} />

                  <View style={styles.registerContainer}>
                    <Text style={[styles.registerText, { fontSize: typography_val.body }]}>Remember your password? </Text>
                    <TouchableOpacity onPress={() => router.replace('/auth/login')}>
                      <Text style={[styles.registerLink, { fontSize: typography_val.body }]}>Sign In</Text>
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.4)',
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
  },
  eyeButton: {},
  errorText: { color: colors.danger },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontWeight: '600', color: colors.card },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: spacing.lg },
  registerText: { color: colors.textSecondary },
  registerLink: { fontWeight: '600', color: '#6366f1' },
});
