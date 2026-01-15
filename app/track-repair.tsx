import { REPAIR_STEPS } from '@/constants/repairSteps';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabaseClient';
import type { Repair } from '@/types/database';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TrackRepairScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string }>();

  const [jobId, setJobId] = useState(params.jobId || '');
  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = useCallback(async (id?: string) => {
    const searchId = id || jobId.trim();

    if (!searchId) {
      if (!id && !params.jobId) setError('Please enter a Job ID');
      return;
    }

    if (Platform.OS !== 'web' && !id) {
      Haptics.selectionAsync();
    }

    if (!repair) setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase!
        .from('repairs')
        .select('*')
        .eq('job_id', searchId)
        .single();

      if (error || !data) {
        if (!repair) { 
            setError('Job ID not found. Please check and try again.');
            Alert.alert('Not Found', 'Invalid Job ID');
        }
      } else {
        setRepair(data);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [jobId, repair, params.jobId]);

  useEffect(() => {
    if (!jobId) return;

    if (!repair) {
      handleTrack(jobId);
    }

    const channel = supabase
      .channel('user-repair-tracking')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'repairs' },
        (payload) => {
          if ((payload.new as Repair)?.job_id === jobId) {
            handleTrack(jobId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, handleTrack, repair]); 

  useEffect(() => {
    const backAction = () => {
      router.replace('/(tabs)');
      return true;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => handler.remove();
  }, [router]);

  useEffect(() => {
    if (params.jobId) {
      setError('');
      setRepair(null);
      handleTrack(params.jobId);
    }
  }, [params.jobId, handleTrack]);

  const cancelRequest = async () => {
    if (!repair) return;

    Alert.alert(
      'Cancel Repair',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            const { error } = await (supabase as any)
              .from('repairs')
              .update({ 
                  status: 'cancelled',
                  updated_at: new Date().toISOString()
              } as any)
              .eq('id', repair.id);

            if (!error) {
              router.back();
            } else {
              Alert.alert('Error', 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const getTimelineInfo = (status: string | undefined) => {
    if (!status) return { currentIndex: -1 };
    const currentStatus = status.toLowerCase();
    const steps = ['received', 'diagnosing', 'repairing', 'repaired', 'completed'];
    const currentIndex = steps.indexOf(currentStatus);
    return { steps, currentIndex };
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
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
        <Text style={styles.headerTitle}>Track Repair</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Track Your Repair</Text>
          <Text style={styles.cardSubtitle}>Enter your Job ID to check repair status</Text>

          <View style={styles.inputContainer}>
            <Search size={20} color={colors.textLight} />
            <TextInput
              placeholder="Enter Job ID"
              placeholderTextColor={colors.textLight}
              style={styles.input}
              value={jobId}
              onChangeText={(text) => {
                setJobId(text);
                setError('');
              }}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && { transform: [{ scale: 0.97 }] },
              !jobId && { opacity: 0.5 },
            ]}
            disabled={!jobId}
            onPress={() => handleTrack()}
          >
            <Text style={styles.buttonText}>Track Status</Text>
          </Pressable>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching repair status...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {repair && (
          <View style={styles.repairCard}>
            <View style={styles.repairHeader}>
              <View>
                <Text style={styles.repairJobId}>Job #{repair.job_id}</Text>
                <Text style={styles.repairDevice}>
                  {repair.device_type}{repair.model ? ` - ${repair.model}` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.repairInfo}>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Service:</Text><Text style={styles.infoValue}>{repair.service}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Issue:</Text><Text style={styles.infoValue}>{repair.issue}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Status:</Text><Text style={[styles.infoValue, styles.statusText]}>{repair.status?.toUpperCase()}</Text></View>
            </View>

            <View style={styles.timelineContainer}>
              <Text style={styles.timelineTitle}>Repair Timeline</Text>
              {REPAIR_STEPS.map((step, index) => {
                const { currentIndex } = getTimelineInfo(repair.status);
                const isDone = currentIndex !== -1 && index <= currentIndex;
                return (
                  <View key={step.key} style={styles.timelineStep}>
                    <View style={[styles.timelineCircle, { backgroundColor: isDone ? '#22c55e' : '#e5e7eb' }]}>
                      <Text style={styles.checkMark}>{isDone ? '✓' : ''}</Text>
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ fontWeight: '600', color: colors.text }}>{step.title}</Text>
                    </View>
                  </View>
                );
              })} 
            </View>

            {repair.admin_notes && (
              <View style={styles.notesCard}>
                <Text style={styles.notesTitle}>Admin Notes</Text>
                <Text style={styles.notesText}>{repair.admin_notes}</Text>
              </View>
            )}

            {repair.status?.toLowerCase() !== 'completed' && repair.status?.toLowerCase() !== 'cancelled' && (
              <TouchableOpacity onPress={cancelRequest} style={styles.cancelButton}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel Request</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: Platform.OS === 'android' ? 40 : spacing.xl },
  scrollContent: { paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.md },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: spacing.xs, color: colors.text },
  cardSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'ios' ? 12 : 2, marginBottom: spacing.lg, borderWidth: 1, borderColor: 'transparent' },
  input: { flex: 1, marginLeft: spacing.sm, fontSize: 16, color: colors.text, height: 40 },
  button: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center', ...shadows.sm },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingContainer: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.lg, ...shadows.sm },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary },
  errorCard: { backgroundColor: '#FEE2E2', borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  errorText: { color: '#DC2626', textAlign: 'center', fontWeight: '500' },
  repairCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.md, marginBottom: spacing.lg },
  repairHeader: { borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.lg, paddingBottom: spacing.lg },
  repairJobId: { fontSize: 20, fontWeight: '700', color: colors.primary },
  repairDevice: { fontSize: 15, color: colors.textSecondary, marginTop: 2 },
  repairInfo: { marginBottom: spacing.lg },
  infoRow: { flexDirection: 'row', marginBottom: spacing.sm },
  infoLabel: { width: 80, fontWeight: '600', color: colors.textSecondary },
  infoValue: { flex: 1, color: colors.text },
  statusText: { color: colors.accent, fontWeight: '700' },
  timelineContainer: { marginBottom: spacing.lg },
  timelineTitle: { fontSize: 18, fontWeight: '600', marginVertical: 16, color: colors.text },
  timelineStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  timelineCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  checkMark: { color: '#fff', fontWeight: 'bold' },
  notesCard: { backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md },
  notesTitle: { fontWeight: '600', marginBottom: spacing.xs, color: colors.text },
  notesText: { color: colors.textSecondary },
  cancelButton: { marginTop: spacing.lg, backgroundColor: '#EF4444', padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' }
});