import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { db } from '@/services/firebaseClient';
import {
  collection,
  getDocs,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { ArrowLeft, ChevronRight, Clock3, Construction, TriangleAlert, UserRound } from 'lucide-react-native';
import { useFocusEffect, useRouter } from '@/navigation/router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAlert } from '@/context/AlertContext';
import { isActiveStatus, formatStatusForDisplay } from '@/utils/statusUtils';

export default function RepairsList() {
  const router = useRouter();
  const alert = useAlert();
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const sortByNewest = (items: any[]) =>
    items.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const isActiveRepair = (item: any) => {
    return isActiveStatus(item?.status) && item?.is_deleted !== true;
  };

  const fetchActiveRepairs = async () => {
    try {
      console.log('🔍 Fetching active repairs for admin...');

      const snapshot = await getDocs(collection(db, 'repairs'));
      const data = snapshot.docs
        .map(d => {
        const docData = d.data();
        return {
          id: d.id,
          ...docData,
          created_at: docData.created_at instanceof Timestamp
            ? docData.created_at.toDate().toISOString()
            : docData.created_at || new Date().toISOString(),
        };
        })
        .filter(isActiveRepair);

      console.log(`✅ Fetched ${data.length} active repairs`);
      sortByNewest(data);

      if (data.length > 0) {
        console.log('🔍 Active repairs details:', data.map((r: any) => ({
          job_id: r.job_id,
          name: r.name,
          status: r.status,
          is_deleted: r.is_deleted
        })));
      }

      setRepairs(data);
    } catch (error: any) {
      console.error('❌ Admin fetch error:', error);
      alert.error('Error', 'Failed to fetch repair requests: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActiveRepairs();
    }, [])
  );

  useEffect(() => {
    // Real-time listener for repairs changes
    const unsubscribe = onSnapshot(collection(db, 'repairs'), (snapshot) => {
      const data = snapshot.docs
        .map(d => {
        const docData = d.data();
        return {
          id: d.id,
          ...docData,
          created_at: docData.created_at instanceof Timestamp
            ? docData.created_at.toDate().toISOString()
            : docData.created_at || new Date().toISOString(),
        };
        })
        .filter(isActiveRepair);
      // Sort by created_at desc
      sortByNewest(data);
      setRepairs(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveRepairs();
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    switch (normalizedStatus) {
      case 'pending': return '#EF4444';
      case 'received': return '#F59E0B';
      case 'diagnosing': return '#3B82F6';
      case 'repairing': return '#8B5CF6';
      case 'repaired': return '#10B981';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push({
        pathname: '/admin/repair/[id]',
        params: { id: item.id }
      })}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.jobId}>{item.job_id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {formatStatusForDisplay(item.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.deviceName}>
        {item.device_type} {item.model ? `• ${item.model}` : ''}
      </Text>
      <View style={styles.row}>
        <UserRound size={14} color={colors.textSecondary} />
        <Text style={styles.metaText}>{item.name} • {item.phone}</Text>
      </View>
      <View style={styles.row}>
        <TriangleAlert size={14} color={colors.textSecondary} />
        <Text style={styles.metaText} numberOfLines={1}>{item.issue}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <ChevronRight size={16} color={colors.textLight} />
      </View>
    </Pressable>
  );
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Active Repairs</Text>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/admin/history' as any)}
        >
          <Clock3 size={20} color={colors.primary} />
          <Text style={styles.historyText}>History</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : repairs.length === 0 ? (
        <View style={styles.emptyState}>
          <Construction size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No Active Repairs</Text>
          <Text style={styles.emptyText}>New repair requests will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={repairs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  historyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.md, gap: 6, ...shadows.sm },
  historyText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, marginTop: -40 },
  emptyTitle: { marginTop: spacing.md, fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText: { marginTop: spacing.sm, textAlign: 'center', color: colors.textSecondary },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  jobId: { fontWeight: '700', fontSize: 16, color: colors.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  statusText: { fontSize: 12, fontWeight: '600' },
  deviceName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  date: { fontSize: 11, color: colors.textLight },
});