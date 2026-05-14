import AppLogo from '@/components/AppLogo';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { SecurityConfig } from '@/config/security';
import { useRouter } from '@/navigation/router';
import { Eye, EyeOff } from 'lucide-react-native';
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
  ImageBackground,
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
    componentSizes: {
      iconMd: 20,
    },
  };
};

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const alert = useAlert();
  const { isTablet, isDesktop, spacing_val, typography_val, componentSizes } = getResponsiveValues();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const errorMsg = await signIn(email.trim(), password);
      if (errorMsg) {
        setError(errorMsg);
        alert.error('Login Failed', errorMsg);
        setLoading(false);
        return;
      }
      // Enhanced role-based redirection with fallback
      const targetIsAdmin = SecurityConfig.isAdminEmail(email);
      
      // Add a small delay to ensure user state is updated in AuthContext
      setTimeout(() => {
        if (targetIsAdmin) {
          router.replace('/admin');
        } else {
          router.replace('/(tabs)');
        }
      }, 100);
    } catch {
      setError('An unexpected error occurred');
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
              transform: [{ translateY: slideAnim }]
            }}
          >
            <View style={styles.centeredContainer}>
              <View style={styles.contentGroup}>
                <View style={styles.logoContainer}>
                  <AppLogo size={isDesktop ? 200 : isTablet ? 180 : 160} />
                </View>
                
                <View style={styles.formContainer}>
                  <Text style={[styles.title, { fontSize: typography_val.h2, marginBottom: spacing_val.sm }]}>Welcome Back</Text>
                  <Text style={[styles.subtitle, { fontSize: typography_val.bodySmall, marginBottom: spacing_val.lg }]}>Sign in to continue</Text>
                  
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
                      onChangeText={(text) => {
                        setEmail(text);
                        setError('');
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                    />

                    <Text style={[styles.label, { fontSize: typography_val.label, marginBottom: spacing_val.sm }]}>Password</Text>
                    <View style={[
                      styles.passwordContainer,
                      {
                        minHeight: spacing_val.inputHeight,
                        borderRadius: borderRadius.md,
                        paddingHorizontal: spacing_val.md,
                        marginBottom: spacing_val.md,
                      },
                    ]}>
                      <TextInput
                        style={[
                          styles.passwordInput,
                          { flex: 1, color: colors.text, fontSize: typography_val.body },
                        ]}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.textLight}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setError('');
                        }}
                        secureTextEntry={!passwordVisible}
                      />
                      <TouchableOpacity
                        onPress={() => setPasswordVisible(!passwordVisible)}
                        style={[styles.eyeButton, { padding: spacing_val.sm }]}
                      >
                        {passwordVisible ? (
                          <EyeOff size={componentSizes.iconMd} color={colors.textSecondary} />
                        ) : (
                          <Eye size={componentSizes.iconMd} color={colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity onPress={() => animateNavigation(() => router.push('/auth/forgot-password'))}>
                      <Text style={[styles.forgotPassword, { fontSize: typography_val.bodySmall, marginBottom: spacing_val.md }]}>Forgot Password?</Text>
                    </TouchableOpacity>
                    
                    {error ? <Text style={[styles.errorText, { fontSize: typography_val.bodySmall, marginBottom: spacing_val.md }]}>{error}</Text> : null}
                    
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
                      onPress={handleLogin}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.buttonText, { fontSize: typography_val.body }]}>
                        {loading ? 'Signing In…' : 'Sign In'}
                      </Text>
                    </TouchableOpacity>
                    <AuthFeedback visible={loading} message={loading ? 'Signing In…' : undefined} />
                    
                    <View style={styles.registerContainer}>
                      <Text style={[styles.registerText, { fontSize: typography_val.body }]}>Don&apos;t have an account? </Text>
                      <TouchableOpacity onPress={() => animateNavigation(() => router.replace('/auth/register'))}>
                        <Text style={[styles.registerLink, { fontSize: typography_val.body }]}>Create Account</Text>
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
  forgotPassword: {
    color: '#6366f1',
    alignSelf: 'flex-end',
    fontWeight: '600',
  },
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