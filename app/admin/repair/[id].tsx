import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
const REPAIR_STATUSES = ['received', 'diagnosing', 'repairing', 'repaired', 'completed'] as const;
export default function AdminRepairDetail() {
  const { id } = useLocalSearchParams();
  const repairId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [repair, setRepair] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const fetchRepair = useCallback(async () => {
    if (!repairId) return;
    if (!supabase) throw new Error('Supabase not initialized');
    const { data, error } = await supabase
      .from('repairs')
      .select('*')
      .eq('id', repairId)
      .single();
    if (error) {
      Alert.alert('Error', 'Could not fetch repair details');
      router.back();
      return;
    }
    setRepair(data);
    if (!adminNotes) {
        setAdminNotes((data as any)?.admin_notes || '');
    }
    setLoading(false);
  }, [repairId, router, adminNotes]);
  useEffect(() => {
    fetchRepair();
  }, [fetchRepair]);
  const updateStatus = async (newStatus: string) => {
    if (!repair?.id) return;
    setUpdating(true);
    const { error } = await (supabase as any)
      .from('repairs')
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString()
      })
      .eq('id', repair.id);
    if (!error) {
      router.back();
    } else {
      setUpdating(false);
      Alert.alert('Error', 'Failed to update status');
    }
  };
  const saveNotes = async () => {
    if (!repairId) return;
    setUpdating(true);
    if (!supabase) throw new Error('Supabase not initialized');
    const { error } = await (supabase as any)
      .from('repairs')
      .update({ 
        admin_notes: adminNotes,
      } as any)
      .eq('id', repairId);
    setUpdating(false);
    if (error) {
      Alert.alert('Error', 'Failed to save notes');
    } else {
      Alert.alert('Saved', 'Notes updated');
      fetchRepair();
    }
  }; 
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  const isFinal = repair?.status === 'completed' || repair?.status === 'cancelled';
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isFinal ? 'Repair Details' : 'Update Repair'}
          </Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.jobId}>Job ID: {repair?.job_id}</Text>
          <Text style={styles.deviceInfo}>
            {repair?.device_type} - {repair?.model}
          </Text>
          <Text style={styles.issueLabel}>Issue reported:</Text>
          <Text style={styles.issueText}>{repair?.issue}</Text>
          <Text style={[styles.issueLabel, { marginTop: 10 }]}>Current Status:</Text>
          <Text style={[styles.issueText, { color: isFinal ? colors.textSecondary : colors.primary, fontWeight: '700', textTransform: 'capitalize' }]}>
            {repair?.status}
          </Text>
        </View>
        {isFinal ? (
            <View style={styles.lockedContainer}>
                <Ionicons name="lock-closed-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.lockedTitle}>Request Closed</Text>
                <Text style={styles.lockedText}>
                    This request is {repair.status} and cannot be edited.
                </Text>
                {repair?.admin_notes ? (
                    <View style={styles.readOnlyNotesBox}>
                        <Text style={styles.issueLabel}>Admin Notes:</Text>
                        <Text style={styles.issueText}>{repair.admin_notes}</Text>
                    </View>
                ) : null}
            </View>
        ) : (
            <>
                <Text style={styles.sectionHeader}>
                  Update Repair Status
                </Text>
                <View style={{ marginBottom: spacing.xl }}>
                  {REPAIR_STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => updateStatus(status)}
                      disabled={updating}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        backgroundColor:
                          repair?.status === status ? '#16a34a' : '#2563eb',
                        marginBottom: 10,
                        opacity: updating ? 0.7 : 1,
                        ...shadows.sm
                      }}
                    >
                      <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
                        Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                      onPress={() => updateStatus('cancelled')}
                      disabled={updating}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        backgroundColor: '#64748B',
                        marginBottom: 10,
                        opacity: updating ? 0.7 : 1,
                        ...shadows.sm
                      }}
                    >
                      <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
                        Mark as Cancelled
                      </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.sectionTitle}>Admin Notes</Text>
                <TextInput
                  placeholder="Add internal notes or customer updates..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                  style={styles.textArea}
                />
                <TouchableOpacity
                  style={[styles.saveButton, updating && { opacity: 0.7 }]}
                  onPress={saveNotes}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Notes Only</Text>
                  )}
                </TouchableOpacity>
            </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingTop: 60,
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backBtn: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  infoCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  jobId: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  deviceInfo: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  issueLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  issueText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  sectionHeader: {
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 12, 
    color: colors.text 
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  textArea: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  saveButton: {
    backgroundColor: colors.textSecondary, 
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  lockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  lockedText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  readOnlyNotesBox: {
    marginTop: spacing.lg,
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  }
});