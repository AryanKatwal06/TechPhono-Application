import { deviceTypes } from '@/constants/services';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabaseClient';
import { formatBookingMessage, openWhatsAppChat } from '@/services/whatsapp';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ service?: string }>();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    phone: user?.user_metadata?.phone || '', 
    deviceType: '',
    model: '',
    issue: '',
    service: params.service || '',
  });
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const backAction = () => {
      router.replace('/(tabs)');
      return true;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => handler.remove();
  }, [router]);
  const handleSubmit = async () => {
    const { name, phone, deviceType, model, issue, service } = formData;
    if (!name || !phone || !deviceType || !issue || !service) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const jobId = `TP-${Date.now()}`;
      const payload = {
        job_id: jobId,
        name,
        phone,
        device_type: deviceType,
        model,
        issue,
        service,
        status: 'Received',
        admin_notes: '',
        user_id: user?.id || null,
      };
      const { error } = await supabase.from('repairs').insert([payload] as any);
      if (error) throw error;
      const message = formatBookingMessage({
        name, phone, deviceType, model, issue, service, jobId,
      });
      openWhatsAppChat(message).catch(() => {});
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        'Repair Booked 🎉',
        `Your Job ID is ${jobId}\nAdmin will contact you shortly.`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };
  if (loading || !user) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              router.back();
            }}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          >
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Book Repair</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter your name"
            placeholderTextColor={colors.textLight}
          />
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="Enter phone number"
            placeholderTextColor={colors.textLight}
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Device Type *</Text>
          <View style={styles.chipContainer}>
            {deviceTypes.map((device) => {
              const isActive = formData.deviceType === device;
              return (
                <TouchableOpacity
                  key={device}
                  activeOpacity={0.7}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setFormData({ ...formData, deviceType: device });
                  }}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{device}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Repair Details</Text>
          <Text style={styles.label}>Model Name (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.model}
            onChangeText={(text) => setFormData({ ...formData, model: text })}
            placeholder="e.g. iPhone 13 Pro"
            placeholderTextColor={colors.textLight}
          />
          <Text style={styles.label}>Service Required *</Text>
          <TextInput
            style={styles.input}
            value={formData.service}
            onChangeText={(text) => setFormData({ ...formData, service: text })}
            placeholder="e.g. Screen Replacement"
            placeholderTextColor={colors.textLight}
          />
          <Text style={styles.label}>Issue Description *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={formData.issue}
            onChangeText={(text) => setFormData({ ...formData, issue: text })}
            multiline
            numberOfLines={4}
            placeholder="Describe the problem..."
            placeholderTextColor={colors.textLight}
          />
        </View>
        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Repair Request</Text>}
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? 40 : spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    ...shadows.sm,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    marginTop: spacing.xs,
  },
  textarea: { height: 120, textAlignVertical: 'top' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#F1F5F9' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.lg,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});