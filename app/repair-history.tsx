import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabaseClient';
import type { Repair } from '@/types/database';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, LogOut, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  useEffect(() => {
    const fetchRepairs = async () => {
      const userPhone = user?.user_metadata?.phone || user?.phone;
      if (!userPhone) {
        setLoadingHistory(false);
        return;
      }
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase!
          .from('repairs')
          .select('*')
          .eq('phone', userPhone)
          .in('status', ['completed', 'cancelled'])
          .order('created_at', { ascending: false });
        if (error) throw error;
        setRepairs(data || []);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchRepairs();
  }, [user]);
  useEffect(() => {
    const backAction = () => {
      router.replace('/(tabs)');
      return true;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => handler.remove();
  }, [router]);
  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };
  const handleDeleteHistoryItem = async (id: string) => {
    try {
      if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { error } = await (supabase as any)
        .from('repairs')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      setRepairs((prev) => prev.filter((repair) => repair.id !== id));
    } catch (error) {
      console.error('Delete item error:', error);
      Alert.alert('Error', 'Failed to delete repair from history.');
    }
  };
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'completed':
      case 'repaired':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return colors.textLight;
    }
  };
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'TechPhono User';
  const displayEmail = user?.email || '';
  const displayPhone = user?.user_metadata?.phone || user?.phone || '';
  if (loading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
        >
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={32} color={colors.primary} />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.infoText}>{displayEmail}</Text>
          <Text style={styles.infoText}>{displayPhone}</Text>
        </View>
        <Text style={styles.sectionTitle}>Repair History</Text>
        {loadingHistory ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
        ) : repairs.length === 0 ? (
          <Text style={styles.emptyText}>No completed or cancelled repairs found.</Text>
        ) : (
          repairs.map((repair) => (
            <View key={repair.id} style={styles.repairCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.jobId}>Job #{repair.job_id}</Text>
                  <Text style={styles.device}>
                    {repair.device_type} {repair.model ? `- ${repair.model}` : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(repair.status) + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(repair.status) }]}>
                    {repair.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.date}>
                  {new Date(repair.created_at).toLocaleDateString()}
                </Text>
                <Pressable onPress={() => handleDeleteHistoryItem(repair.id)}>
                  <Text style={styles.deleteItemText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
        <View style={styles.actionContainer}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.85 }]}
          >
            <LogOut size={20} color="#fff" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 40 : spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: { padding: spacing.lg },
  profileCard: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  infoText: { fontSize: 14, color: colors.textSecondary, marginBottom: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.md, color: colors.text },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginVertical: 20 },
  repairCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  jobId: { fontSize: 16, fontWeight: '700', color: colors.primary },
  device: { fontSize: 14, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  date: { fontSize: 13, color: colors.textLight },
  deleteItemText: { fontSize: 13, color: colors.danger, fontWeight: '500' },
  actionContainer: { marginTop: spacing.xl, gap: spacing.md },
  logoutButton: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});