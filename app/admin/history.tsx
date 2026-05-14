import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { db } from '@/services/firebaseClient';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { ArrowLeft, Archive, CheckCircle2, ChevronRight, Clock3, TriangleAlert, UserRound } from 'lucide-react-native';
import { useFocusEffect, useRouter } from '@/navigation/router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAlert } from '@/context/AlertContext';
import { formatStatusForDisplay } from '@/utils/statusUtils';

export default function RepairHistoryAdmin() {
  const router = useRouter();
  const alert = useAlert();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const sortByNewest = (items: any[]) =>
    items.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const isHistoryRepair = (item: any) => {
    const normalizedStatus = item?.status?.toLowerCase?.() || '';
    return ['completed', 'cancelled'].includes(normalizedStatus) && item?.is_deleted !== true;
  };

  const fetchHistory = async () => {
    try {
      console.log('🔍 Fetching repair history for admin...');

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
        .filter(isHistoryRepair);

      sortByNewest(data);

      console.log(`✅ Fetched ${data.length} history records`);
      setHistory(data);
    } catch (error: any) {
      console.error('❌ History fetch error:', error);
      alert.error('Error', 'Failed to fetch repair history: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  useEffect(() => {
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
        .filter(isHistoryRepair);
      sortByNewest(data);
      setHistory(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleArchive = async (id: string) => {
    alert.confirm(
      'Archive Record',
      'Are you sure you want to remove this from the history view?',
      async () => {
        try {
          await updateDoc(doc(db, 'repairs', id), { is_deleted: true });
          setHistory((prev) => prev.filter((item) => item.id !== id));
        } catch {
          alert.error('Error', 'Failed to archive record.');
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
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
      <View style={styles.footer}>
        <Text style={styles.date}>
          Created: {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <TouchableOpacity onPress={() => handleArchive(item.id)} style={styles.archiveBtn}>
          <Archive size={16} color={colors.textSecondary} />
          <Text style={styles.archiveText}>Archive</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Repair History</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyState}>
          <CheckCircle2 size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No History</Text>
          <Text style={styles.emptyText}>Completed or Cancelled repairs will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -40 },
  emptyTitle: { marginTop: spacing.md, fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText: { marginTop: spacing.sm, color: colors.textSecondary },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  jobId: { fontWeight: '700', fontSize: 16, color: colors.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  statusText: { fontSize: 12, fontWeight: '600' },
  deviceName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  date: { fontSize: 12, color: colors.textLight },
  archiveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  archiveText: { fontSize: 12, color: colors.textSecondary },
});