import { REPAIR_STEPS } from '@/constants/repairSteps';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { db } from '@/services/firebaseClient';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Repair } from '@/types/database';
import { Haptics } from '@/utils/haptics';
import { Stack, useLocalSearchParams, useRouter } from '@/navigation/router';
import { ArrowLeft, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useAlert } from '@/context/AlertContext';
import {
  ActivityIndicator,
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

// Helper to convert Firestore doc to Repair type
const docToRepair = (docSnap: any): Repair => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    job_id: data.job_id,
    name: data.name,
    phone: data.phone,
    device_type: data.device_type,
    model: data.model || null,
    issue: data.issue,
    service: data.service,
    status: data.status,
    created_at: data.created_at instanceof Timestamp
      ? data.created_at.toDate().toISOString()
      : data.created_at || new Date().toISOString(),
    admin_notes: data.admin_notes || null,
    rating: data.rating || null,
    feedback: data.feedback || null,
    is_deleted: data.is_deleted || false,
    deleted_at: data.deleted_at || null,
  };
};

export default function TrackRepairScreen() {
  const router = useRouter();
  const alert = useAlert();
  const params = useLocalSearchParams<{ jobId?: string }>();

  const [jobId, setJobId] = useState(params.jobId || '');
  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getTimelineInfo = (status: string | undefined) => {
    if (!status) return { currentIndex: -1 };
    const currentStatus = status.toLowerCase();
    const steps = ['received', 'diagnosing', 'repairing', 'repaired', 'completed'];
    const currentIndex = steps.indexOf(currentStatus);
    return { steps, currentIndex };
  };

  const handleTrack = useCallback(async (id?: string) => {
    const searchId = id || jobId.trim();

    if (!searchId) {
      if (!id && !params.jobId) setError('Please enter a Job ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const q = query(
        collection(db, 'repairs'),
        where('job_id', '==', searchId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.warn('No data found for Job ID:', searchId);
        setError('Job ID not found. Please check and try again.');
        alert.error('Not Found', 'Invalid Job ID');
      } else {
        const repairData = docToRepair(snapshot.docs[0]);
        setRepair(repairData);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(err.message || 'An unexpected error occurred.');
      alert.error('Error', err.message || 'Failed to fetch repair details');
    } finally {
      setLoading(false);
    }
  }, [jobId, params.jobId, alert]);

  // Effect to handle initial job ID from params or state — run whenever `jobId` changes
  useEffect(() => {
    if (!jobId) return;
    handleTrack(jobId);
  }, [jobId, handleTrack]);

  // Effect to handle real-time updates
  useEffect(() => {
    if (!jobId) return;

    // Set up Firestore real-time listener
    const q = query(
      collection(db, 'repairs'),
      where('job_id', '==', jobId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const updatedRepair = docToRepair(change.doc);
          if (updatedRepair.job_id === jobId) {
            setRepair(updatedRepair);
          }
        }
      });
    }, (error) => {
      console.error('Real-time listener error:', error);
    });

    return () => {
      unsubscribe();
    };
  }, [jobId]); // Only depends on jobId, not handleTrack

  useEffect(() => {
    const backAction = () => {
      router.replace('/(tabs)');
      return true;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => handler.remove();
  }, [router]);

  useEffect(() => {
    if (params.jobId && params.jobId !== jobId) {
      setError('');
      setRepair(null);
      setJobId(params.jobId);
    }
  }, [params.jobId]);

  const cancelRequest = async () => {
    if (!repair) return;

    alert.confirm(
      'Cancel Repair',
      'Are you sure you want to cancel this request?',
      async () => {
            try {
              const updateData: any = {
                status: 'cancelled',
              };
              
              // Only add updated_at if the field exists in the schema
              if ('updated_at' in repair) {
                updateData.updated_at = serverTimestamp();
              }
              
              await updateDoc(doc(db, 'repairs', repair.id), updateData);

              // Update local state to reflect the change
              setRepair(prev => prev ? { ...prev, status: 'cancelled' } : null);
              
              alert.success('Success', 'Repair request cancelled successfully');
              router.back();
            } catch (error: any) {
              console.error('Failed to cancel repair:', error);
              
              let errorMessage = 'Failed to cancel request';
              if (error.code === 'permission-denied') {
                errorMessage = 'You do not have permission to cancel this request';
              } else if (error.code === 'not-found') {
                errorMessage = 'Repair request not found';
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              alert.error('Error', errorMessage);
            }
          }
    );
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