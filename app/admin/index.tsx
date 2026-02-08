import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabaseClient';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { ClipboardList, LogOut, Package, Wrench } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { normalizeStatus } from '@/utils/statusUtils';

export default function AdminHome() {
  const router = useRouter();
  const { user, loading, signOut, isAdmin } = useAuth(); 
  const [totalRepairs, setTotalRepairs] = useState(0);
  const [pendingRepairs, setPendingRepairs] = useState(0); 
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      if (!supabase) {
        console.error('❌ Supabase client not initialized');
        throw new Error('Supabase client not available');
      }
      console.log('🔍 Fetching admin stats...');
      
      // Test basic connection first
      console.log('🔗 Testing Supabase connection...');
      const { error: testError } = await supabase
        .from('repairs')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase connection test failed:', testError);
        throw testError;
      }
      console.log('✅ Supabase connection successful');
      
      // DEBUG: Check all repairs first
      const { data: allRepairs, error: allError } = await supabase
        .from('repairs')
        .select('id, status, is_deleted');
      
      if (allError) {
        console.error('❌ Error fetching all repairs:', allError);
        throw allError;
      }
      console.log('📊 ADMIN REPAIRS DATA:', allRepairs);
      
      // Total Repairs (exclude cancelled and deleted) - using simpler approach
      const { count: total, error: totalError } = await supabase
        .from('repairs')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);
      
      if (totalError) {
        console.error('❌ Error fetching total repairs:', totalError);
        throw totalError;
      }
      
      // Active Repairs (received, diagnosing, repairing, repaired) - using direct status values
      const activeStatuses = ['received', 'diagnosing', 'repairing', 'repaired'];
      console.log('⚡ Active statuses filter:', activeStatuses);
      
      const { count: active, error: activeError } = await supabase
        .from('repairs')
        .select('*', { count: 'exact', head: true })
        .in('status', activeStatuses)
        .eq('is_deleted', false);
      
      if (activeError) {
        console.error('❌ Error fetching active repairs:', activeError);
        throw activeError;
      }
      
      console.log(`✅ Stats fetched - Total: ${total}, Active: ${active}`);
      setTotalRepairs(total ?? 0);
      setPendingRepairs(active ?? 0);
      
      // Warn about any data issues
      if (allRepairs) {
        const issues = [];
        const deletedCount = allRepairs.filter(r => r.is_deleted).length;
        const nullStatusCount = allRepairs.filter(r => !r.status).length;
        const invalidStatusCount = allRepairs.filter(r => 
          r.status && !normalizeStatus(r.status)
        ).length;
        
        if (deletedCount > 0) issues.push(`${deletedCount} deleted repairs`);
        if (nullStatusCount > 0) issues.push(`${nullStatusCount} repairs with null status`);
        if (invalidStatusCount > 0) issues.push(`${invalidStatusCount} repairs with invalid status`);
        
        if (issues.length > 0) {
          console.warn('⚠️ Data issues found:', issues.join(', '));
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching admin stats:', error);
      
      let errorMessage = 'Failed to fetch repair statistics';
      if (error?.message) {
        errorMessage = `Database error: ${error.message}`;
      } else if (error?.error_description) {
        errorMessage = `Authentication error: ${error.error_description}`;
      } else if (typeof error === 'string') {
        errorMessage = `Error: ${error}`;
      }
      
      Alert.alert('Error', errorMessage);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>
          Welcome, {user.user_metadata?.full_name || 'Admin'}
        </Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalRepairs}</Text>
          <Text style={styles.statLabel}>Total Repairs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingRepairs}</Text>
          <Text style={styles.statLabel}>Active Repairs</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/admin/repairs')} 
      >
        <ClipboardList color="#fff" size={18} />
        <Text style={styles.primaryButtonText}>View Repair Requests</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/admin/manage-items')}
      >
        <Package color={colors.primary} size={18} />
        <Text style={styles.secondaryButtonText}>Manage Items</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/admin/manage-services')}
      >
        <Wrench color={colors.primary} size={18} />
        <Text style={styles.secondaryButtonText}>Manage Services</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.logoutButton, loggingOut && { opacity: 0.7 }]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <LogOut color="#fff" size={18} />
        )}
        <Text style={styles.logoutText}>{loggingOut ? 'Logging out...' : 'Logout'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 1.4,
    paddingBottom: 30,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
  primaryButton: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});