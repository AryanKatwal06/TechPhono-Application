import { RatingStars } from '@/components/RatingStars';
import { colors } from '@/constants/theme';
import { useTechPhono } from '@/context/TechPhonoContext';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
export default function FeedbackScreen() {
  const router = useRouter();
  const { repairId } = useLocalSearchParams<{ repairId?: string }>();
  const { submitFeedback } = useTechPhono();
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const handleSubmit = async () => {
    if (!repairId) {
      Alert.alert('Error', 'Invalid repair reference');
      return;
    }
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating');
      return;
    }
    if (!feedback.trim()) {
      Alert.alert('Feedback Required', 'Please write your feedback');
      return;
    }
    setLoading(true);
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const result = await submitFeedback(repairId, rating, feedback.trim());
    setLoading(false);
    if (result.success) {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        'Thank You! 🙏',
        'Your feedback has been submitted successfully.',
        [{ text: 'Go to Home', onPress: () => router.replace('/') }]
      );
    } else {
      Alert.alert('Submission Failed', result.error || 'Please try again later');
    }
  };
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Feedback',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>How was your experience?</Text>
          <Text style={styles.subtitle}>Your feedback helps us improve our service quality</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Rate our service</Text>
            <RatingStars
              rating={rating}
              size={36}
              onRate={(value) => {
                setRating(value);
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            />
          </View>
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>Your Feedback</Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Tell us what went well or what we can improve..."
              placeholderTextColor={colors.textLight}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backButton: { paddingHorizontal: 12 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  ratingContainer: { marginBottom: 24, alignItems: 'center' },
  ratingLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  feedbackContainer: { marginBottom: 20 },
  feedbackLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  feedbackInput: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: 12, 
    padding: 12, 
    color: colors.text, 
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  submitButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 }
});