import { Skeleton } from '@/components/Skeleton';
import { WhatsAppFAB } from '@/components/WhatsAppFAB';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { supabase } from '@/services/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronRight,
  Phone,
  Search,
  User,
  Wrench,
  AlertCircle,
  RefreshCw,
  // ✅ Added new icons here
  ClipboardList,
  ShoppingBag,
} from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl
} from 'react-native';

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const [jobId, setJobId] = useState('');
  const [authReady, setAuthReady] = useState(false);
  
  // Dynamic Services State
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchServices = async () => {
    try {
      setError(false);
      const { data, error: supabaseError } = await supabase
        .from('services')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (supabaseError) throw supabaseError;
      setServices(data || []);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAuthReady(true), 1500);
    fetchServices();

    const channel = supabase
      .channel('services-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => fetchServices())
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  // Handler functions (keeping your existing ones)
  const handleCall = () => Linking.openURL('tel:8527361011');
  const handleBookRepair = () => router.push('/booking');
  const handleTrackRepair = () => jobId.trim() && router.push(`/track-repair?jobId=${jobId}`);
  const handleService = (service: Service) => {
    router.push({ pathname: '/booking', params: { service: service.name, price: service.price.toString() } });
  };

  if (!authReady) {
    return (
      <View style={styles.skeletonContainer}>
        <StatusBar style="dark" />
        <Skeleton height={32} width={150} style={{ marginBottom: 20 }} />
        <Skeleton height={180} style={{ marginBottom: 24, borderRadius: 28 }} />
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
             <Skeleton height={100} style={{ flex: 1, borderRadius: 18 }} />
             <Skeleton height={100} style={{ flex: 1, borderRadius: 18 }} />
        </View>
        <Skeleton height={32} width={200} style={{ marginBottom: 16 }} />
        <Skeleton height={80} style={{ marginBottom: 12 }} />
        <Skeleton height={80} style={{ marginBottom: 12 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.headerGradient}>
        <View style={styles.headerTop}>
          <View style={styles.brandContainer}>
            <Image source={require('@/assets/logo.png')} style={styles.brandLogo} />
            <View>
              <Text style={styles.brandText}>TechPhono</Text>
              <Text style={styles.tagline}>Gadgets ka Doctor</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/repair-history')}>
            <User size={22} color={colors.card} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerActions}>
           <TouchableOpacity onPress={handleBookRepair} style={{ flex: 1 }} activeOpacity={0.9}>
            <View style={styles.primaryButton}>
                <Wrench size={18} color={colors.primary} />
                <Text style={styles.primaryButtonText}>Book Repair</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCall} style={{ flex: 1 }} activeOpacity={0.9}>
            <View style={[styles.primaryButton, styles.secondaryButton]}>
                <Phone size={18} color="#fff" />
                <Text style={[styles.primaryButtonText, { color: '#fff' }]}>Call Now</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Track Card */}
        <View style={styles.trackCard}>
          <Text style={styles.trackTitle}>Track Your Repair</Text>
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter Job ID"
              value={jobId}
              onChangeText={setJobId}
            />
          </View>
          <TouchableOpacity
            style={[styles.trackButton, !jobId.trim() && styles.trackButtonDisabled]}
            onPress={handleTrackRepair}
            disabled={!jobId.trim()}
          >
            <Text style={styles.trackButtonText}>Track Status</Text>
            <ChevronRight size={20} color={colors.card} />
          </TouchableOpacity>
        </View>

        {/* ✅ QUICK ACTIONS UI (Inserted Here) */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/track-repair')}
          >
            <Wrench size={26} color="#2563EB" />
            <Text style={styles.quickActionText}>Track Repair</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/booking')}
          >
            <ClipboardList size={26} color="#2563EB" />
            <Text style={styles.quickActionText}>Book Repair</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/shop')}
          >
            <ShoppingBag size={26} color="#2563EB" />
            <Text style={styles.quickActionText}>Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => Linking.openURL('tel:+919999999999')}
          >
            <Phone size={26} color="#2563EB" />
            <Text style={styles.quickActionText}>Call Now</Text>
          </TouchableOpacity>
        </View>

        {/* Popular Services Section with Add-ons */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Services</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/services')}>
                <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={24} color={colors.danger} />
            <Text style={styles.errorText}>Failed to load services</Text>
            <TouchableOpacity onPress={fetchServices} style={styles.retryBtn}>
                <RefreshCw size={14} color={colors.primary} />
                <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : services.length === 0 ? (
          <Text style={styles.emptyText}>No services available currently.</Text>
        ) : (
          services.slice(0, 4).map(service => (
            <TouchableOpacity key={service.id} activeOpacity={0.7} onPress={() => handleService(service)}>
              <View style={styles.serviceCard}>
                <View style={{ flex: 1 }}>
                  <View style={styles.serviceHeaderRow}>
                    <Text style={styles.serviceTitle}>{service.name}</Text>
                    {service.price > 0 && (
                        <View style={styles.priceBadge}>
                            <Text style={styles.priceText}>₹{service.price}</Text>
                        </View>
                    )}
                  </View>
                  <Text style={styles.serviceSub} numberOfLines={2}>
                      {service.description}
                  </Text>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      <WhatsAppFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skeletonContainer: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 60 },
  headerGradient: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  brandContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 34, height: 34 },
  brandText: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  tagline: { fontSize: 12, color: colors.card, opacity: 0.8 },
  profileButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 12 },
  primaryButton: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 4 },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', elevation: 0 },
  primaryButtonText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  content: { padding: spacing.lg, paddingTop: 24 },
  trackCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.xl, ...shadows.md },
  trackTitle: { fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.background, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  searchInput: { flex: 1, paddingVertical: spacing.md },
  trackButton: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: borderRadius.md, flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  trackButtonDisabled: { opacity: 0.5 },
  trackButtonText: { color: colors.card, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  seeAll: { color: colors.primary, fontWeight: '600' },
  serviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6', ...shadows.sm },
  serviceHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  serviceTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  priceBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priceText: { color: '#0369A1', fontSize: 12, fontWeight: '700' },
  serviceSub: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  errorContainer: { alignItems: 'center', padding: 20 },
  errorText: { color: '#6B7280', marginTop: 8 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  retryText: { color: colors.primary, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginVertical: 20 },
  
  // ✅ NEW STYLES ADDED HERE
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 0, // Adjusted to align with other content which has padding in parent
    marginBottom: 8,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});