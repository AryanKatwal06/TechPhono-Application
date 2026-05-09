import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/services/firebaseClient';
import {
  collection,
  getDocs,
} from 'firebase/firestore';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ClipboardList, Clock3, LogOut, Package, ShieldCheck, Sparkles, Wrench } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeStatus, isActiveStatus, isClosedStatus } from '@/utils/statusUtils';

export default function AdminHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading, signOut, isAdmin } = useAuth();
  const [totalRepairs, setTotalRepairs] = useState(0);
  const [pendingRepairs, setPendingRepairs] = useState(0);
  const [completedRepairs, setCompletedRepairs] = useState(0);
  const [newRepairs, setNewRepairs] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const fetchStats = async () => {
    try {
      console.log('🔍 Fetching admin stats...');

      const snapshot = await getDocs(collection(db, 'repairs'));
      const allRepairs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const visibleRepairs = allRepairs.filter((repair: any) => repair?.is_deleted !== true);

      const total = visibleRepairs.length;
      const active = visibleRepairs.filter((repair: any) => isActiveStatus(repair?.status)).length;
      const completed = visibleRepairs.filter((repair: any) => isClosedStatus(repair?.status)).length;
      const pendingCount = visibleRepairs.filter((repair: any) => normalizeStatus(repair?.status) === 'pending').length;

      console.log(`✅ Stats fetched - Total: ${total}, Active: ${active}, Completed: ${completed}`);
      setTotalRepairs(total);
      setPendingRepairs(active);
      setCompletedRepairs(completed);
      setNewRepairs(pendingCount);

      const invalidStatusCount = visibleRepairs.filter((repair: any) =>
        repair?.status && !normalizeStatus(repair.status)
      ).length;

      if (invalidStatusCount > 0) {
        console.warn('⚠️ Data issues found:', `${invalidStatusCount} repairs with invalid status`);
      }
    } catch (error: any) {
      console.error('❌ Error fetching admin stats:', error);

      let errorMessage = 'Failed to fetch repair statistics';
      if (error?.message) {
        errorMessage = `Database error: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = `Error: ${error}`;
      }

      // Keep the dashboard usable even if stats cannot be fetched.
      console.warn('Admin stats unavailable:', errorMessage);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchStats();
    } catch (err) {
      console.error('Refresh failed', err);
    } finally {
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (user) fetchStats();
    }, [user])
  );
  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!user || !isAdmin) {
    return <Redirect href="/" />;
  }
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      if (signOut) await signOut();
      router.replace('/auth/login');
    } catch (err: any) {
      Alert.alert('Logout failed', err.message);
    } finally {
      setLoggingOut(false);
    }
  };
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#F8FAFC', '#EEF4FF', '#F8FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(8, Math.round(insets.top * 0.35)), paddingBottom: insets.bottom + 56 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#1E40AF', '#2563EB', '#60A5FA']}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Sparkles size={14} color="#fff" />
              <Text style={styles.heroBadgeText}>Admin Workspace</Text>
            </View>
            <View style={styles.heroAvatar}>
              <ShieldCheck size={18} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.heroTitle}>Welcome, {user.displayName || 'Admin'}</Text>
          <Text style={styles.heroSubtitle}>
            Track repairs, manage catalog content, and keep service flow moving.
          </Text>
          <View style={styles.heroActions}>
            <Pressable
              onPress={() => router.push('/admin/repairs')}
              style={({ pressed }) => [styles.heroButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            >
              <ClipboardList color={colors.primary} size={18} />
              <Text style={styles.heroButtonText}>Open Repairs</Text>
              <ArrowRight color={colors.primary} size={16} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/admin/manage-services')}
              style={({ pressed }) => [styles.heroGhostButton, pressed && { opacity: 0.92 }]}
            >
              <Text style={styles.heroGhostButtonText}>Manage Services</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <Animated.View style={[styles.statCard, { transform: [{ scale: pulse }] }]}>
            <Text style={styles.statNumber}>{totalRepairs}</Text>
            <Text style={styles.statLabel}>Total repairs</Text>
          </Animated.View>
          <Animated.View style={[styles.statCard, styles.statCardAccent, { transform: [{ scale: pulse }] }]}>
            <Text style={styles.statNumber}>{pendingRepairs}</Text>
            <Text style={styles.statLabel}>Active queue</Text>
          </Animated.View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{newRepairs}</Text>
            <Text style={styles.statLabel}>New pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedRepairs}</Text>
            <Text style={styles.statLabel}>Closed jobs</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionHint}>Daily operations</Text>
          </View>
          <TouchableOpacity
            style={styles.actionPrimary}
            onPress={() => router.push('/admin/repairs')}
            activeOpacity={0.88}
          >
            <ClipboardList color="#fff" size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionPrimaryTitle}>View Repair Requests</Text>
              <Text style={styles.actionPrimarySubtitle}>Review and update incoming repairs</Text>
            </View>
            <ArrowRight color="#fff" size={18} />
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionSecondary}
              onPress={() => router.push('/admin/manage-items')}
              activeOpacity={0.88}
            >
              <Package color={colors.primary} size={18} />
              <Text style={styles.actionSecondaryText}>Manage Items</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSecondary}
              onPress={() => router.push('/admin/manage-services')}
              activeOpacity={0.88}
            >
              <Wrench color={colors.primary} size={18} />
              <Text style={styles.actionSecondaryText}>Manage Services</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Status Snapshot</Text>
            <Clock3 color={colors.textLight} size={16} />
          </View>
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>{pendingRepairs}</Text>
              <Text style={styles.snapshotLabel}>Active repairs</Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>{newRepairs}</Text>
              <Text style={styles.snapshotLabel}>Pending intake</Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>{completedRepairs}</Text>
              <Text style={styles.snapshotLabel}>Closed</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, loggingOut && { opacity: 0.75 }]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.9}
        >
          {loggingOut ? <ActivityIndicator color="#fff" /> : <LogOut color="#fff" size={18} />}
          <Text style={styles.logoutText}>{loggingOut ? 'Logging out...' : 'Logout'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: spacing.xl,
    fontSize: 31,
    fontWeight: '800',
    color: '#fff',
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#fff',
    opacity: 0.88,
    lineHeight: 22,
  },
  heroActions: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    gap: 12,
  },
  heroButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  heroButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
    marginLeft: 10,
  },
  heroGhostButton: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 130,
  },
  heroGhostButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    minHeight: 124,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statCardAccent: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textLight,
  },
  actionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: spacing.lg,
  },
  actionPrimaryTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  actionPrimarySubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionSecondary: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: borderRadius.lg,
    minHeight: 84,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionSecondaryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  snapshotItem: {
    flex: 1,
    alignItems: 'center',
    minHeight: 82,
  },
  snapshotValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  snapshotLabel: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
  snapshotDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});