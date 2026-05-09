import AppLogo from '@/components/AppLogo';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useSearchParams } from 'expo-router';
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
import AuthFeedback from '@/components/AuthFeedback';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth, db } from '@/services/firebaseClient';
import { collection, query, where, getDocs, updateDoc, serverTimestamp, doc } from 'firebase/firestore';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const params = useSearchParams();
  const oobCode = params?.oobCode as string | undefined;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
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

  useEffect(() => {
    // If an out-of-band code is present, validate it on load to give early feedback
    let mounted = true;
    (async () => {
      if (!oobCode) return;
      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        if (mounted) {
          Alert.alert('Reset Link Valid', `Resetting password for ${email}`);
        }
      } catch (err) {
        console.error('Invalid or expired reset code:', err);
        if (mounted) {
          Alert.alert('Invalid Link', 'The password reset link is invalid or expired.');
          router.replace('/auth/forgot-password');
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [oobCode, router]);

  const handleResetPassword = async () => {
    // Basic validations
    setError('');
    if (!password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Strong password check
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    const strongRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
    if (!strongRegex.test(password)) {
      setError('Password must include uppercase, lowercase, number and special character');
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (oobCode) {
        // Confirm via Firebase OOB flow
        await confirmPasswordReset(auth, oobCode, password);

        // Attempt to update users collection timestamp (best-effort)
        try {
          const email = await verifyPasswordResetCode(auth, oobCode);
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', email));
          const snapshot = await getDocs(q);
          const updates: Promise<any>[] = [];
          snapshot.forEach((docSnap) => {
            updates.push(updateDoc(doc(db, 'users', docSnap.id), {
              passwordUpdatedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }));
          });
          await Promise.all(updates);
        } catch (dbErr) {
          console.warn('Unable to update passwordUpdatedAt field:', dbErr);
        }

        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Alert.alert('Success', 'Password updated successfully. Please login again.', [
          { text: 'OK', onPress: () => router.replace('/auth/login') },
        ]);
        return;
      }

      // No oobCode - update current signed-in user's password
      const errorMsg = await updatePassword(password);
      if (errorMsg) {
        setError(errorMsg);
        Alert.alert('Reset Failed', errorMsg);
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Success', 'Your password has been reset successfully. You can now login with your new password.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') },
      ]);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err?.message || 'An unexpected error occurred');
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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Create your new password</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your new password"
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

          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm your new password"
              placeholderTextColor={colors.textLight}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError('');
              }}
              secureTextEntry={!confirmPasswordVisible}
            />
            <TouchableOpacity
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={confirmPasswordVisible ? 'eye-off' : 'eye'}
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Resetting Password…' : 'Reset Password'}
            </Text>
          </TouchableOpacity>

          <AuthFeedback visible={loading} message={loading ? 'Resetting Password…' : undefined} />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
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
