import AppLogo from '@/components/AppLogo';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { SecurityConfig } from '@/config/security';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const backAction = () => {
      router.replace('/auth/login'); 
      return true;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', backAction);

    // Start entrance animations
    const entranceAnimation = Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ])
    ]);

    entranceAnimation.start();

    return () => {
      handler.remove();
      entranceAnimation.stop();
    };
  }, [router, fadeAnim, slideAnim, scaleAnim]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      const errorMsg = await signIn(email.trim(), password);
      if (errorMsg) {
        setError(errorMsg);
        Alert.alert('Login Failed', errorMsg);
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setLoading(false);
        return;
      }
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => {
        const targetIsAdmin = SecurityConfig.adminEmails.includes(email.trim().toLowerCase());
        if (targetIsAdmin) {
          router.replace('/admin');
        } else {
          router.replace('/(tabs)');
        }
      }, 300);
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.ScrollView 
        contentContainerStyle={styles.content} 
        keyboardShouldPersistTaps="handled"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/auth/login')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.header}>
            <AppLogo size={140} />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>
        </Animated.View>
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.inputField}
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
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
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
              style={styles.eyeButton}
            >
              <Ionicons
                name={passwordVisible ? 'eye-off' : 'eye'}
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing In…' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/register')}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: { marginBottom: spacing.xxl, alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: spacing.xs },
  form: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: spacing.sm },
  inputField: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    padding: spacing.md,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  passwordInput: { flex: 1, height: 50, color: colors.text, fontSize: 16 },
  eyeButton: { padding: spacing.sm },
  forgotPassword: {
    color: colors.primary,
    marginTop: 4,
    marginBottom: spacing.md,
    alignSelf: 'flex-end',
    fontWeight: '600',
  },
  errorText: { fontSize: 14, color: colors.danger, marginBottom: spacing.md },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '600', color: colors.card },
  registerContainer: { flexDirection: 'row', justifyContent: 'center' },
  registerText: { fontSize: 15, color: colors.textSecondary },
  registerLink: { fontSize: 15, fontWeight: '600', color: colors.primary },
});