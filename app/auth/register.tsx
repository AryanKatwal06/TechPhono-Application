import AppLogo from '@/components/AppLogo';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const backAction = () => {
      router.replace('/auth/login');
      return true;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => handler.remove();
  }, [router]);
  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      Alert.alert('Error', 'All fields are required');
      setError('All fields are required');
      return;
    }
    if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      setError('Invalid phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const res = await signUp(email.trim(), password, phone.trim(), name.trim());
      if (!res.success) {
        const errorMsg = res.error || 'Signup failed';
        Alert.alert('Signup failed', errorMsg);
        setError(errorMsg);
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        'Verify your email',
        'We have sent a verification link to your email. Please verify it before logging in.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      Alert.alert('Registration Failed', msg);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/auth/login')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.header}>
          <AppLogo size={140} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join TechPhono today</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textLight}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError('');
            }}
          />
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter your email"
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={(text) => {
              setEmail(text.trim());
              setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Create a password (min 6 characters)"
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
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter your phone number"
            placeholderTextColor={colors.textLight}
            value={phone}
            onChangeText={(text) => {
              setPhone(text.replace(/[^0-9]/g, ''));
              setError('');
            }}
            keyboardType="phone-pad"
            maxLength={10}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account…' : 'Create Account'}
            </Text>
          </TouchableOpacity>
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    marginBottom: spacing.md,
  },
  passwordInput: { flex: 1, height: 50, color: colors.text, fontSize: 16 },
  eyeButton: { padding: spacing.sm },
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
  loginContainer: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { fontSize: 15, color: colors.textSecondary },
  loginLink: { fontSize: 15, fontWeight: '600', color: colors.primary },
});